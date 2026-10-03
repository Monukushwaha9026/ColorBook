import type { AIProvider, BookPlan, BookPlanInput } from './ai-provider.interface.js';
import { GeminiService } from './gemini.service.js';
import { AppError } from '../../middleware/errorHandler.js';

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
   * Plan a coloring book using the AI provider, with seamless fallback if Gemini key is not set
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
      try {
        const plan = await this.provider.generateBookPlan(input);
        const durationMs = Date.now() - startTime;
        console.log(`[AI] Book plan generated successfully in ${durationMs}ms: "${plan.title}" (${plan.pages.length} pages)`);
        return plan;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[BookPlannerService] Primary AI planner failed (${msg}). Seamlessly generating cohesive coloring book plan from prompt...`);
        return this.generateFallbackPlan(input);
      }
    } finally {
      this.inFlightPlans.delete(lockKey);
    }
  }

  /**
   * Generates a tailored, cohesive coloring book plan directly from the user's prompt
   */
  private static generateFallbackPlan(input: BookPlanInput): BookPlan {
    const trimmed = input.prompt.trim();
    const shortTitle = trimmed.length <= 40 ? trimmed : trimmed.slice(0, 37) + '...';
    const capitalizedTitle = shortTitle.charAt(0).toUpperCase() + shortTitle.slice(1);
    const difficultyMap: Record<string, 'easy' | 'medium' | 'detailed' | 'intricate'> = {
      kids: 'easy',
      children: 'medium',
      teens: 'detailed',
      teen_plus: 'intricate',
    };
    const difficulty = difficultyMap[input.ageGroup] || 'medium';

    const actionKeywords = [
      'Exploring and discovering new adventures',
      'Playing happily with friends in a vibrant scene',
      'Resting peacefully in a beautiful landscape',
      'Celebrating a joyful moment together',
      'Embarking on a daring quest through the scenery',
      'Discovering hidden treasures and playful surprises',
      'Enjoying a sunny day surrounded by nature',
      'Soaring across the horizon with excitement',
      'Gathering around for a fun evening celebration',
      'A majestic panoramic view of the entire adventure',
    ];

    const pages = [];
    for (let i = 1; i <= input.pageCount; i++) {
      const action = actionKeywords[(i - 1) % actionKeywords.length];
      const pageTitle = `Scene ${i}: ${capitalizedTitle}`;
      const concept = `${capitalizedTitle} - ${action}`;
      const visualPrompt = `Coloring book line art, pure black lines on crisp white background, ${concept}, clean enclosed outlines suitable for coloring, zero shading, zero grayscale`;

      pages.push({
        pageNumber: i,
        title: pageTitle,
        concept,
        visualPrompt,
        difficulty,
      });
    }

    return {
      title: `${capitalizedTitle} Coloring Book`,
      theme: trimmed,
      styleDirection: input.ageGroup === 'kids'
        ? 'Thick bold outlines, large open coloring regions, simple friendly shapes'
        : input.ageGroup === 'children'
        ? 'Clear medium outlines, engaging background details, playful composition'
        : 'Detailed intricate linework, rich textures, dynamic composition',
      pages,
    };
  }
}
