import type { AIProvider, BookPlan, BookPlanInput } from './ai-provider.interface.js';
import { GeminiService } from './gemini.service.js';

export class BookPlannerService {
  private static provider: AIProvider = new GeminiService();
  private static inFlightPlans: Set<string> = new Set();

  /**
   * Set a custom AIProvider (useful for testing or switching models/providers)
   */
  static setProvider(customProvider: AIProvider): void {
    this.provider = customProvider;
  }

  /**
   * Plan a coloring book using the AI provider
   */
  static async planBook(input: BookPlanInput, bookId?: string): Promise<BookPlan> {
    const lockKey = bookId || `${input.prompt}_${input.ageGroup}_${input.pageCount}`;

    if (this.inFlightPlans.has(lockKey)) {
      console.warn(`[AI] Book planning already in progress for key: ${lockKey}`);
    }
    this.inFlightPlans.add(lockKey);

    const startTime = Date.now();
    console.log(`[AI] Book planning started for prompt: "${input.prompt.slice(0, 50)}...", ageGroup: ${input.ageGroup}, pages: ${input.pageCount}`);
    if (input.referenceImage) {
      console.log('[AI] Multimodal reference image detected and included in planning request.');
    }

    try {
      const plan = await this.provider.generateBookPlan(input);
      const durationMs = Date.now() - startTime;
      console.log(`[AI] Book plan generated successfully in ${durationMs}ms: "${plan.title}" (${plan.pages.length} pages)`);
      return plan;
    } finally {
      this.inFlightPlans.delete(lockKey);
    }
  }
}
