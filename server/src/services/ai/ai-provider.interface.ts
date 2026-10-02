export type AgeGroup = 'kids' | 'children' | 'teens' | 'teen_plus';

export type PageDifficulty = 'easy' | 'medium' | 'detailed' | 'intricate';

export interface BookPlanInput {
  prompt: string;
  ageGroup: AgeGroup;
  pageCount: number;
  referenceImage?: string | null;
}

export interface BookPagePlan {
  pageNumber: number;
  title: string;
  concept: string;
  visualPrompt: string;
  difficulty: PageDifficulty;
}

export interface BookPlan {
  title: string;
  theme: string;
  styleDirection: string;
  pages: BookPagePlan[];
}

export interface AIProvider {
  generateBookPlan(input: BookPlanInput): Promise<BookPlan>;
}
