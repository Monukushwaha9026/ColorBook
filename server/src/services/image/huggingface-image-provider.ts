import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';
import { ImagePromptBuilder } from './image-prompt-builder.js';
import { AppError } from '../../middleware/errorHandler.js';

export class HuggingFaceImageProvider implements ImageProvider {
  readonly name = 'huggingface';
  private apiKey: string | undefined;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey !== undefined ? apiKey : process.env.HUGGINGFACE_API_KEY?.trim();
    this.model = model !== undefined ? model : process.env.HUGGINGFACE_MODEL?.trim() || 'black-forest-labs/FLUX.1-schnell';
  }

  async generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
    const apiKey = this.apiKey !== undefined ? this.apiKey : process.env.HUGGINGFACE_API_KEY?.trim();
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
      throw new AppError(
        'Hugging Face API key is not configured. Please set HUGGINGFACE_API_KEY in your environment or .env file.',
        500,
        'HUGGINGFACE_CONFIG_ERROR'
      );
    }

    const prompt = ImagePromptBuilder.buildPrompt(input);
    const negativePrompt = ImagePromptBuilder.buildNegativePrompt();
    const seed = input.variationSeed || Math.floor(Math.random() * 1000000);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    // Hugging Face routes modern diffusion models (like FLUX.1) via partner inference providers
    const customProvider = process.env.HUGGINGFACE_INFERENCE_PROVIDER?.trim();
    const candidateProviders = Array.from(new Set([customProvider || 'nscale', 'together', 'fal-ai'])).filter(Boolean);

    console.log(
      `[HuggingFaceImageProvider] Initiating generation for model: ${this.model} (Seed: ${seed}, Candidate Providers: ${candidateProviders.join(', ')})`
    );

    let lastError: Error | null = null;

    try {
      for (const provider of candidateProviders) {
        const endpoint = `https://router.huggingface.co/${provider}/v1/images/generations`;
        console.log(`[HuggingFaceImageProvider] Attempting generation via provider '${provider}'...`);

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json, image/png, image/jpeg, */*',
            },
            body: JSON.stringify({
              prompt,
              negative_prompt: negativePrompt,
              model: this.model,
              response_format: 'b64_json',
              width: 1024,
              height: 1024,
              seed,
            }),
            signal: controller.signal,
          });

          if (response.status === 401 || response.status === 403) {
            throw new AppError(
              'Hugging Face authentication failed: invalid or expired API key. Please verify your HUGGINGFACE_API_KEY.',
              401,
              'HUGGINGFACE_AUTH_ERROR'
            );
          }

          if (response.status === 429) {
            throw new AppError(
              'Hugging Face rate limit or quota exceeded. Free tier inference is subject to provider rate limits.',
              429,
              'HUGGINGFACE_RATE_LIMIT'
            );
          }

          if (response.status === 404) {
            console.warn(`[HuggingFaceImageProvider] Model '${this.model}' not found on provider '${provider}' (404)`);
            lastError = new AppError(
              `Hugging Face model "${this.model}" was not found or is inaccessible on provider ${provider}.`,
              404,
              'HUGGINGFACE_MODEL_NOT_FOUND'
            );
            continue;
          }

          if (!response.ok) {
            let errText = `HTTP ${response.status}`;
            try {
              const errJson: any = await response.json();
              if (errJson?.error) {
                errText = typeof errJson.error === 'string' ? errJson.error : JSON.stringify(errJson.error);
              }
            } catch {
              try {
                errText = (await response.text()).slice(0, 150);
              } catch {
                // Ignore
              }
            }

            console.warn(`[HuggingFaceImageProvider] Provider '${provider}' returned HTTP ${response.status}: ${errText}`);
            lastError = new AppError(`Hugging Face (${provider}) failed: ${errText}`, response.status, 'HUGGINGFACE_API_ERROR');
            continue;
          }

          // Successful response - could be b64_json or binary
          const contentType = response.headers.get('content-type') || '';
          let imageBuffer: Buffer;

          if (contentType.includes('application/json')) {
            const data: any = await response.json();
            const b64 = data?.data?.[0]?.b64_json;
            if (!b64) {
              console.warn(`[HuggingFaceImageProvider] Provider '${provider}' response missing b64_json payload`);
              continue;
            }
            imageBuffer = Buffer.from(b64, 'base64');
          } else {
            const arrayBuf = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuf);
          }

          if (imageBuffer.length < 512) {
            console.warn(`[HuggingFaceImageProvider] Provider '${provider}' returned truncated buffer (${imageBuffer.length} bytes)`);
            continue;
          }

          clearTimeout(timeoutId);
          console.log(`[HuggingFaceImageProvider] Image generated successfully via provider '${provider}' (${imageBuffer.length} bytes)`);

          return {
            buffer: imageBuffer,
            mimeType: 'image/png',
            width: 1024,
            height: 1024,
          };
        } catch (innerErr: unknown) {
          if (innerErr instanceof AppError && (innerErr.code === 'HUGGINGFACE_AUTH_ERROR' || innerErr.code === 'HUGGINGFACE_RATE_LIMIT')) {
            throw innerErr;
          }
          const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
          console.warn(`[HuggingFaceImageProvider] Provider '${provider}' connection error: ${msg}`);
          lastError = innerErr instanceof Error ? innerErr : new Error(msg);
        }
      }

      // If loop finished without returning
      clearTimeout(timeoutId);
      if (lastError instanceof AppError) {
        throw lastError;
      }
      throw new AppError(
        `All Hugging Face candidate providers (${candidateProviders.join(', ')}) failed for model ${this.model}. ${lastError?.message || ''}`,
        502,
        'HUGGINGFACE_API_ERROR'
      );
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof AppError) {
        throw err;
      }

      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError(
          `Hugging Face image generation timed out after 60 seconds for model ${this.model}.`,
          504,
          'HUGGINGFACE_TIMEOUT'
        );
      }

      console.warn(`[HuggingFaceImageProvider] Request failed: ${message}`);
      throw new AppError(
        `Failed to communicate with Hugging Face Inference API: ${message}`,
        502,
        'HUGGINGFACE_API_ERROR'
      );
    }
  }
}
