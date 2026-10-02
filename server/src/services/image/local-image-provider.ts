import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';
import { ImagePromptBuilder } from './image-prompt-builder.js';
import { AppError } from '../../middleware/errorHandler.js';

export class LocalImageProvider implements ImageProvider {
  readonly name = 'local';
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || process.env.LOCAL_IMAGE_API_URL || 'http://localhost:7860';
  }

  async generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
    const prompt = ImagePromptBuilder.buildPrompt(input);
    const negativePrompt = ImagePromptBuilder.buildNegativePrompt();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for local generation

    try {
      // Standard A1111 / SD.Next txt2img API format
      const endpoint = `${this.apiUrl.replace(/\/$/, '')}/sdapi/v1/txt2img`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          steps: 20,
          width: 768,
          height: 1024,
          cfg_scale: 7.5,
          sampler_name: 'Euler a',
          seed: input.variationSeed || -1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AppError(
          `Local image provider returned status ${response.status}`,
          503,
          'LOCAL_IMAGE_PROVIDER_UNAVAILABLE'
        );
      }

      const data = (await response.json()) as { images?: string[] };
      const rawBase64 = data.images?.[0];

      if (!rawBase64) {
        throw new AppError(
          'Local image provider returned an empty image list.',
          502,
          'LOCAL_IMAGE_PROVIDER_EMPTY'
        );
      }

      const cleanBase64 = rawBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      return {
        buffer,
        mimeType: 'image/png',
        width: 768,
        height: 1024,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof AppError) {
        throw err;
      }

      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[LocalImageProvider] Connection failed to ${this.apiUrl}: ${message}`);

      throw new AppError(
        `Local image generation server at ${this.apiUrl} is unavailable. Please verify your local AI service is running or switch to another provider.`,
        503,
        'LOCAL_IMAGE_PROVIDER_UNAVAILABLE'
      );
    }
  }
}
