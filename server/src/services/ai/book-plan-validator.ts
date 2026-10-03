import type { BookPlan, BookPlanInput, BookPagePlan, PageDifficulty } from './ai-provider.interface.js';

export class BookPlanValidator {
  /**
   * Sanitize prompt text against prompt injection, control characters, and excess length
   */
  static sanitizePrompt(rawPrompt: string): string {
    if (!rawPrompt || typeof rawPrompt !== 'string') {
      return '';
    }

    // Strip control characters (except common punctuation and whitespace)
    const cleaned = rawPrompt.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
    // Enforce reasonable limit
    return cleaned.slice(0, 500);
  }

  /**
   * Safely parse raw JSON from Gemini (handling markdown fences or surrounding commentary)
   */
  static extractJsonFromText(rawText: string): unknown {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Gemini response is empty.');
    }

    let cleaned = rawText.trim();

    // Remove markdown code fences if present (e.g., ```json ... ```)
    if (cleaned.startsWith('```')) {
      const firstNewline = cleaned.indexOf('\n');
      if (firstNewline !== -1) {
        cleaned = cleaned.slice(firstNewline + 1);
      }
      const lastFence = cleaned.lastIndexOf('```');
      if (lastFence !== -1) {
        cleaned = cleaned.slice(0, lastFence);
      }
      cleaned = cleaned.trim();
    }

    // If still surrounded by extraneous commentary, find the outer JSON object { ... }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      // Attempt repair of common LLM JSON defects:
      // 1. Unclosed trailing decimals (e.g. "1." -> "1.0")
      // 2. Trailing commas before closing braces/brackets
      const repaired = cleaned
        .replace(/(\d+)\.(?=[,\s}\]])/g, '$1.0')
        .replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(repaired);
      } catch (err) {
        throw new Error(`Failed to parse AI JSON response: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Validate and conform raw parsed data into a strict BookPlan matching expected pageCount
   */
  static validateAndConformPlan(raw: unknown, input: BookPlanInput): BookPlan {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Parsed AI response is not an object.');
    }

    const data = raw as Record<string, unknown>;

    // 1. Title, Theme, Style Direction
    const title =
      typeof data.title === 'string' && data.title.trim().length > 0
        ? data.title.trim()
        : `${this.capitalize(input.prompt)} Coloring Book`;

    const theme =
      typeof data.theme === 'string' && data.theme.trim().length > 0
        ? data.theme.trim()
        : input.prompt.trim();

    const defaultStyle = this.getDefaultStyleForAge(input.ageGroup);
    const styleDirection =
      typeof data.styleDirection === 'string' && data.styleDirection.trim().length > 0
        ? data.styleDirection.trim()
        : defaultStyle;

    // 2. Validate Pages
    const rawPages = Array.isArray(data.pages) ? data.pages : [];
    const validPages: BookPagePlan[] = [];

    const defaultDifficulty = this.getDefaultDifficultyForAge(input.ageGroup);

    for (let i = 0; i < rawPages.length; i++) {
      const p = rawPages[i];
      if (p && typeof p === 'object') {
        const pageNum = i + 1;
        const pageTitle =
          typeof p.title === 'string' && p.title.trim().length > 0
            ? p.title.trim()
            : `Scene ${pageNum}`;

        const pageConcept =
          typeof p.concept === 'string' && p.concept.trim().length > 0
            ? p.concept.trim()
            : `A delightful coloring scene of ${input.prompt} - part ${pageNum}.`;

        const visualPrompt =
          typeof p.visualPrompt === 'string' && p.visualPrompt.trim().length > 0
            ? p.visualPrompt.trim()
            : `Coloring book page, ${input.prompt}, black and white line art, clean outlines, no shading, white background`;

        const difficulty = this.conformDifficulty(p.difficulty, input.ageGroup);

        validPages.push({
          pageNumber: pageNum,
          title: pageTitle,
          concept: pageConcept,
          visualPrompt,
          difficulty,
        });
      }
    }

    // 3. Strictly enforce pageCount matching the user's request
    const targetCount = input.pageCount;
    let finalPages: BookPagePlan[];

    if (validPages.length >= targetCount) {
      // Truncate to exact count
      finalPages = validPages.slice(0, targetCount).map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
      }));
    } else {
      // Fill missing pages to guarantee exact count
      finalPages = [...validPages];
      for (let i = finalPages.length; i < targetCount; i++) {
        const pageNum = i + 1;
        finalPages.push({
          pageNumber: pageNum,
          title: `${title} - Page ${pageNum}`,
          concept: `Coloring page exploring ${theme} with interactive and engaging elements.`,
          visualPrompt: `Coloring book line art, ${theme}, scene ${pageNum}, bold clean black outlines on pure white background, completely enclosed spaces, printable page`,
          difficulty: defaultDifficulty,
        });
      }
    }

    return {
      title,
      theme,
      styleDirection,
      pages: finalPages,
    };
  }

  private static conformDifficulty(val: unknown, ageGroup: BookPlanInput['ageGroup']): PageDifficulty {
    const valid: PageDifficulty[] = ['easy', 'medium', 'detailed', 'intricate'];
    if (typeof val === 'string' && valid.includes(val.toLowerCase() as PageDifficulty)) {
      return val.toLowerCase() as PageDifficulty;
    }
    return this.getDefaultDifficultyForAge(ageGroup);
  }

  private static getDefaultDifficultyForAge(ageGroup: BookPlanInput['ageGroup']): PageDifficulty {
    switch (ageGroup) {
      case 'kids':
        return 'easy';
      case 'children':
        return 'easy';
      case 'teens':
        return 'medium';
      case 'teen_plus':
        return 'detailed';
      default:
        return 'easy';
    }
  }

  private static getDefaultStyleForAge(ageGroup: BookPlanInput['ageGroup']): string {
    switch (ageGroup) {
      case 'kids':
        return 'Bold, extra-thick black outlines with simple friendly shapes and large coloring spaces';
      case 'children':
        return 'Clean clear line art with playful characters and moderate scene details';
      case 'teens':
        return 'Expressive linework with layered perspective and creative stylistic details';
      case 'teen_plus':
        return 'Intricate black-and-white line art with rich textures and ornate patterns';
      default:
        return 'Clean printable coloring book line art';
    }
  }

  private static capitalize(str: string): string {
    if (!str) return 'Coloring Book';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
