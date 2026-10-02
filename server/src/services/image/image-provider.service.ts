import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';
import { LocalImageProvider } from './local-image-provider.js';
import { FreeImageProvider } from './free-image-provider.js';
import { ImageValidator, type ImageValidationResult } from './image-validator.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface ValidatedImageResult {
  image: GeneratedImage;
  attempts: number;
  validation: ImageValidationResult;
}

export class ImageProviderService {
  private static provider: ImageProvider = new LocalImageProvider();
  private static maxAttempts = Number(process.env.MAX_IMAGE_GENERATION_ATTEMPTS || 3);

  static {
    this.refreshProvider();
  }

  static refreshProvider(): void {
    const providerName = (process.env.IMAGE_PROVIDER || 'local').toLowerCase();
    if (providerName === 'free') {
      this.provider = new FreeImageProvider();
    } else {
      this.provider = new LocalImageProvider();
    }
  }

  static setProvider(customProvider: ImageProvider): void {
    this.provider = customProvider;
  }

  static getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Generate an image with automated validation and up to 3 retry attempts
   */
  static async generateValidatedImage(input: ImageGenerationInput): Promise<ValidatedImageResult> {
    let attempts = 0;
    const maxAttempts = this.maxAttempts;
    const failureReasons: string[] = [];

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[ImageProviderService] Generating image for Page ${input.pageNumber} (Attempt ${attempts}/${maxAttempts}) using provider: ${this.provider.name}`);

      try {
        const generated = await this.provider.generateImage({
          ...input,
          variationSeed: (input.variationSeed || 1000) + attempts * 7919, // Fresh seed for retries
        });

        // Validate the generated image
        const validation = ImageValidator.validate(generated.buffer);

        if (validation.valid) {
          console.log(`[ImageProviderService] Page ${input.pageNumber} passed validation on attempt ${attempts} (Score: ${validation.score})`);
          return {
            image: generated,
            attempts,
            validation,
          };
        }

        const reason = `Attempt ${attempts} failed validation: ${validation.reasons.join(', ')}`;
        console.warn(`[ImageProviderService] ${reason}`);
        failureReasons.push(reason);

        // If local provider is unavailable, and not on final attempt, check if fallback is possible
        if (attempts >= maxAttempts) {
          break;
        }
      } catch (err: unknown) {
        if (err instanceof AppError && err.code === 'LOCAL_IMAGE_PROVIDER_UNAVAILABLE') {
          // If local server is not running and user configured local, let the controlled error bubble up
          // or try FreeImageProvider fallback if allowed
          console.warn(`[ImageProviderService] Local provider unavailable on attempt ${attempts}: ${err.message}`);
          if (attempts >= maxAttempts) {
            throw err;
          }
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          failureReasons.push(`Attempt ${attempts} error: ${msg}`);
        }
      }
    }

    throw new AppError(
      `Image generation failed after ${attempts} attempts. Reasons: ${failureReasons.join('; ')}`,
      502,
      'IMAGE_GENERATION_FAILED'
    );
  }
}
