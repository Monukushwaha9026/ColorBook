import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';
import { LocalImageProvider } from './local-image-provider.js';
import { HuggingFaceImageProvider } from './huggingface-image-provider.js';
import { GeminiImageProvider } from './gemini-image-provider.js';
import { TestImageProvider } from './test-image-provider.js';
import { ImageValidator, type ImageValidationResult } from './image-validator.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface ValidatedImageResult {
  image: GeneratedImage;
  attempts: number;
  validation: ImageValidationResult;
}

export class ImageProviderService {
  private static provider: ImageProvider | null = null;
  private static isCustomProvider = false;
  private static maxAttempts = Number(process.env.MAX_IMAGE_GENERATION_ATTEMPTS || 3);

  private static getConfiguredProviderName(): string {
    return (process.env.IMAGE_PROVIDER || 'local').toLowerCase().trim();
  }

  public static getProvider(): ImageProvider {
    const configuredName = this.getConfiguredProviderName();
    if (!this.provider || (!this.isCustomProvider && this.provider.name !== configuredName)) {
      this.refreshProvider();
    }
    return this.provider!;
  }

  static refreshProvider(): void {
    this.isCustomProvider = false;
    const providerName = this.getConfiguredProviderName();

    if (providerName === 'gemini') {
      this.provider = new GeminiImageProvider();
    } else if (providerName === 'huggingface') {
      this.provider = new HuggingFaceImageProvider();
    } else if (providerName === 'test' || providerName === 'free') {
      this.provider = new TestImageProvider();
    } else {
      this.provider = new LocalImageProvider();
    }
  }

  static validateConfiguration(): { provider: string; status: 'ok' | 'warning' | 'error'; message: string } {
    const providerName = this.getConfiguredProviderName();

    if (providerName === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      const model = process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-2.5-flash-image';
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return {
          provider: 'gemini',
          status: 'warning',
          message: 'Gemini API key is missing. Set GEMINI_API_KEY in .env before generating images.',
        };
      }
      console.log(`[ImageProviderService] Provider: 'gemini' (Primary: ${model})`);
      return {
        provider: 'gemini',
        status: 'ok',
        message: `Gemini image generation configured with model ${model}`,
      };
    }

    if (providerName === 'local') {
      const apiUrl = process.env.LOCAL_IMAGE_API_URL || 'http://localhost:7860';
      console.log(`[ImageProviderService] Provider: 'local' (Target: ${apiUrl})`);
      return {
        provider: 'local',
        status: 'ok',
        message: `Local Stable Diffusion API configured at ${apiUrl}`,
      };
    }

    if (providerName === 'huggingface') {
      const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
      const model = process.env.HUGGINGFACE_MODEL?.trim() || 'black-forest-labs/FLUX.1-schnell';
      if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
        const warning = `[ImageProviderService] Warning: IMAGE_PROVIDER='huggingface' but HUGGINGFACE_API_KEY is not configured in .env.`;
        console.warn(warning);
        return {
          provider: 'huggingface',
          status: 'warning',
          message: 'Hugging Face API key is missing. Set HUGGINGFACE_API_KEY in .env before generating images.',
        };
      }
      console.log(`[ImageProviderService] Provider: 'huggingface' (Model: ${model})`);
      return {
        provider: 'huggingface',
        status: 'ok',
        message: `Hugging Face Inference API configured with model ${model}`,
      };
    }

    if (providerName === 'test' || providerName === 'free') {
      console.log(`[ImageProviderService] Provider: 'test' (TEST / DEVELOPMENT FALLBACK - synthetic line art)`);
      return {
        provider: 'test',
        status: 'ok',
        message: 'Synthetic test provider active for automated tests / local dev.',
      };
    }

    console.warn(`[ImageProviderService] Unknown provider '${providerName}'. Defaulting to 'local'.`);
    return {
      provider: providerName,
      status: 'warning',
      message: `Unrecognized provider '${providerName}'. Using local provider fallback.`,
    };
  }

  static setProvider(customProvider: ImageProvider): void {
    this.provider = customProvider;
    this.isCustomProvider = true;
  }

  static getProviderName(): string {
    return this.getProvider().name;
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
      const currentProvider = this.getProvider();
      console.log(`[ImageProviderService] Generating image for Page ${input.pageNumber} (Attempt ${attempts}/${maxAttempts}) using provider: ${currentProvider.name}`);

      try {
        const generated = await currentProvider.generateImage({
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

        if (attempts >= maxAttempts) {
          break;
        }
      } catch (err: unknown) {
        if (
          err instanceof AppError &&
          (err.code === 'LOCAL_IMAGE_PROVIDER_UNAVAILABLE' ||
            err.code === 'HUGGINGFACE_AUTH_ERROR' ||
            err.code === 'HUGGINGFACE_CONFIG_ERROR' ||
            err.code === 'HUGGINGFACE_MODEL_NOT_FOUND')
        ) {
          console.warn(`[ImageProviderService] Provider error: ${err.message}`);
          throw err;
        } else if (err instanceof AppError && err.code === 'GEMINI_IMAGE_QUOTA_EXHAUSTED') {
          console.warn(`[ImageProviderService] Gemini Image quota limit reached (free tier limit 0). Attempting fallback to Hugging Face provider...`);
          try {
            const fallback = new HuggingFaceImageProvider();
            const fbResult = await fallback.generateImage(input);
            const val = ImageValidator.validate(fbResult.buffer);
            if (val.valid) {
              console.log(`[ImageProviderService] Successfully generated Page ${input.pageNumber} using fallback provider: huggingface`);
              return {
                image: fbResult,
                attempts,
                validation: val,
              };
            }
          } catch (fbErr: any) {
            console.warn(`[ImageProviderService] Fallback also failed: ${fbErr.message}`);
          }
          throw err;
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[ImageProviderService] Attempt ${attempts} error: ${msg}`);
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
