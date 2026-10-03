import { GoogleGenAI } from '@google/genai';
import type { AIProvider, BookPlan, BookPlanInput } from './ai-provider.interface.js';
import { COLORING_BOOK_SYSTEM_PROMPT } from './prompts/coloring-book-system-prompt.js';
import { BookPlanValidator } from './book-plan-validator.js';
import { AppError } from '../../middleware/errorHandler.js';

export class GeminiService implements AIProvider {
  private client: GoogleGenAI | null = null;
  private currentApiKey: string | null = null;
  private getCandidateModels(): string[] {
    const configured = process.env.GEMINI_TEXT_MODEL?.trim();
    const defaults = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];
    return Array.from(new Set([configured, ...defaults])).filter(Boolean) as string[];
  }

  private getClient(): GoogleGenAI {
    // Re-check environment variable dynamically so keys set in .env are picked up
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.length === 0) {
      throw new AppError('Gemini API is not configured.', 500, 'AI_CONFIGURATION_ERROR');
    }

    if (!this.client || this.currentApiKey !== apiKey) {
      this.client = new GoogleGenAI({ apiKey });
      this.currentApiKey = apiKey;
    }

    return this.client;
  }

  async generateBookPlan(input: BookPlanInput): Promise<BookPlan> {
    const ai = this.getClient();
    const sanitizedPrompt = BookPlanValidator.sanitizePrompt(input.prompt);

    const promptUserInstruction = `
Please design a ${input.pageCount}-page black-and-white coloring book.
Prompt: "${sanitizedPrompt}"
Target Age Group: "${input.ageGroup}"
Number of Pages: ${input.pageCount}

Produce unique, sequential pages numbered 1 to ${input.pageCount}.
Ensure each page has a distinct title, concept, visualPrompt, and age-appropriate difficulty.
`;

    // Multimodal support: if referenceImage is provided as a data URL (e.g. data:image/png;base64,...)
    const contents: Array<string | { inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    if (input.referenceImage && input.referenceImage.startsWith('data:image/')) {
      const match = input.referenceImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contents.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
    }

    contents.push({
      text: promptUserInstruction,
    });

    let lastError: unknown = null;
    const candidateModels = this.getCandidateModels();

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: COLORING_BOOK_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const responseText = response.text;
        if (!responseText) {
          throw new AppError('No content returned from Gemini API.', 502, 'AI_EMPTY_RESPONSE');
        }

        const parsed = BookPlanValidator.extractJsonFromText(responseText);
        const conformedPlan = BookPlanValidator.validateAndConformPlan(parsed, input);

        return conformedPlan;
      } catch (err: unknown) {
        lastError = err;
        if (err instanceof AppError && err.code === 'AI_CONFIGURATION_ERROR') {
          throw err;
        }

        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('API key not valid') || message.includes('API_KEY_INVALID') || message.includes('403 Forbidden')) {
          throw new AppError('Gemini API key is invalid or expired.', 401, 'AI_CONFIGURATION_ERROR');
        }

        if (
          message.includes('404') ||
          message.includes('no longer available') ||
          message.includes('NOT_FOUND') ||
          message.includes('503') ||
          message.includes('high demand')
        ) {
          console.warn(`[GeminiService] Model '${model}' skipped (${message.slice(0, 80)}). Trying next candidate model...`);
          continue;
        }

        console.warn(`[GeminiService] Error with model '${model}': ${message.slice(0, 80)}`);
      }
    }

    console.error('[GeminiService Error]: All candidate models failed. Last error:', lastError);
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new AppError(`Failed to generate book plan: ${msg}`, 502, 'AI_GENERATION_FAILED');
  }
}
