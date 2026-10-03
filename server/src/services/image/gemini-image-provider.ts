import { GoogleGenAI } from '@google/genai';
import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';
import { ImagePromptBuilder } from './image-prompt-builder.js';
import { AppError } from '../../middleware/errorHandler.js';

export class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini';
  private apiKey: string | undefined;
  private model: string;
  private client: GoogleGenAI | null = null;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY?.trim();
    this.model = model !== undefined ? model : process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-2.5-flash-image';
  }

  private getClient(): GoogleGenAI {
    const key = this.apiKey !== undefined ? this.apiKey : process.env.GEMINI_API_KEY?.trim();
    if (!key || key.length === 0 || key === 'your_gemini_api_key_here') {
      throw new AppError(
        'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.',
        500,
        'GEMINI_CONFIG_ERROR'
      );
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
    return this.client;
  }

  async generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
    const ai = this.getClient();
    const prompt = ImagePromptBuilder.buildPrompt(input);
    const candidateModels = Array.from(new Set([this.model, 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image']));

    console.log(`[GeminiImageProvider] Initiating image generation (Candidate models: ${candidateModels.join(', ')})`);

    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      console.log(`[GeminiImageProvider] Requesting image via model '${modelName}'...`);
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseModalities: ['IMAGE'],
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            const mimeType = part.inlineData.mimeType || 'image/png';

            console.log(`[GeminiImageProvider] Successfully generated image via model '${modelName}' (${buffer.length} bytes)`);

            return {
              buffer,
              mimeType: mimeType.includes('jpeg') ? 'image/jpeg' : 'image/png',
              width: 1024,
              height: 1024,
            };
          }
        }

        console.warn(`[GeminiImageProvider] Model '${modelName}' responded without inline image data.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        // Detect quota exhaustion (limit 0 on free tier)
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('limit: 0') || msg.includes('quota')) {
          console.warn(
            `[GeminiImageProvider] Gemini Image generation quota exhausted on model '${modelName}' (Free tier limit is 0 for image models; billing must be enabled in Google AI Studio / Google Cloud).`
          );
          lastError = new AppError(
            `Gemini image generation requires an active pay-as-you-go project in Google AI Studio (free-tier quota limit is 0 for image models). Details: ${msg.slice(0, 150)}`,
            429,
            'GEMINI_IMAGE_QUOTA_EXHAUSTED'
          );
          // Don't retry same quota error across all models
          break;
        }

        console.warn(`[GeminiImageProvider] Model '${modelName}' error: ${msg.slice(0, 150)}`);
        lastError = err instanceof Error ? err : new Error(msg);
      }
    }

    if (lastError instanceof AppError) {
      throw lastError;
    }

    throw new AppError(
      `Gemini image generation failed: ${lastError?.message || 'No image returned from Gemini models.'}`,
      502,
      'GEMINI_IMAGE_GENERATION_FAILED'
    );
  }
}
