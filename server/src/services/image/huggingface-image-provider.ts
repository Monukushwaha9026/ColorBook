import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';
import { ImagePromptBuilder } from './image-prompt-builder.js';
import { AppError } from '../../middleware/errorHandler.js';

export class HuggingFaceImageProvider implements ImageProvider {
  readonly name = 'huggingface';
  private apiKey: string | undefined;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY?.trim();
    this.model = model || process.env.HUGGINGFACE_MODEL?.trim() || 'black-forest-labs/FLUX.1-schnell';
  }

  async generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
    const apiKey = this.apiKey || process.env.HUGGINGFACE_API_KEY?.trim();
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

    const endpoint = `https://api-inference.huggingface.co/models/${encodeURIComponent(this.model)}`;

    console.log(`[HuggingFaceImageProvider] Requesting image from model: ${this.model} (Seed: ${seed})`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'image/png, image/jpeg, */*',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: negativePrompt,
            seed,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          'Hugging Face authentication failed: invalid or expired API key. Please verify your HUGGINGFACE_API_KEY.',
          401,
          'HUGGINGFACE_AUTH_ERROR'
        );
      }

      if (response.status === 404) {
        throw new AppError(
          `Hugging Face model "${this.model}" was not found or is inaccessible with your account permissions.`,
          404,
          'HUGGINGFACE_MODEL_NOT_FOUND'
        );
      }

      if (response.status === 429) {
        throw new AppError(
          'Hugging Face rate limit or quota exceeded. Free tier inference is subject to provider rate limits.',
          429,
          'HUGGINGFACE_RATE_LIMIT'
        );
      }

      if (response.status === 503) {
        let waitTime = 20;
        try {
          const errJson = (await response.json()) as { estimated_time?: number };
          if (errJson.estimated_time) waitTime = Math.ceil(errJson.estimated_time);
        } catch {
          // ignore
        }
        throw new AppError(
          `Hugging Face model "${this.model}" is currently loading (estimated wait: ${waitTime}s). Please retry in a moment.`,
          503,
          'HUGGINGFACE_MODEL_LOADING'
        );
      }

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errJson = (await response.json()) as { error?: string | string[] };
          if (errJson.error) {
            errMessage = Array.isArray(errJson.error) ? errJson.error.join(', ') : errJson.error;
          }
        } catch {
          try {
            errMessage = await response.text();
          } catch {
            // ignore
          }
        }
        throw new AppError(
          `Hugging Face generation failed (${response.status}): ${errMessage}`,
          response.status >= 500 ? 502 : response.status,
          'HUGGINGFACE_API_ERROR'
        );
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 512) {
        throw new AppError(
          'Hugging Face returned an empty or truncated image buffer.',
          502,
          'HUGGINGFACE_EMPTY_RESPONSE'
        );
      }

      return {
        buffer,
        mimeType: contentType.includes('jpeg') ? 'image/jpeg' : 'image/png',
        width: 768,
        height: 1024,
      };
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

      console.warn(`[HuggingFaceImageProvider] Network error: ${message}`);
      throw new AppError(
        `Failed to communicate with Hugging Face Inference API: ${message}`,
        502,
        'HUGGINGFACE_API_ERROR'
      );
    }
  }
}
