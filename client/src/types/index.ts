export type AgeGroupId = 'kids' | 'children' | 'teens' | 'teen_plus';

export type BookStatus = 'draft' | 'planning' | 'generating' | 'completed' | 'failed' | 'cancelled';

export interface AgeGroupOption {
  id: AgeGroupId;
  label: string;
  range: string;
  description: string;
  iconSrc: string;
}

export interface ColoringPageItem {
  id: string;
  bookId?: string;
  pageNumber: number;
  concept: string;
  title: string;
  description?: string;
  visualPrompt?: string;
  difficulty?: 'easy' | 'medium' | 'detailed' | 'intricate' | string;
  imageUrl?: string | null;
  status?: 'pending' | 'planned' | 'generating' | 'completed' | 'failed';
  isRegenerating?: boolean;
}

export type PaperSize = 'A4' | 'LETTER';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export type CreationStep = 1 | 2 | 3 | 4;

export interface Book {
  id: string;
  title?: string;
  theme?: string;
  styleDirection?: string;
  prompt: string;
  ageGroup: AgeGroupId;
  pageCount: number;
  status: BookStatus;
  pages: ColoringPageItem[];
  paperSize?: PaperSize;
  orientation?: Orientation;
  referenceImage?: string | null;
  referenceImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  coverImage?: string;
}

export interface PlanBookResponse {
  success: boolean;
  book: Book;
  pages: ColoringPageItem[];
}

export interface SuggestedPrompt {
  id: string;
  category: string;
  iconName: string;
  iconSrc?: string;
  label: string;
  prompt: string;
}

export interface ThemeCategory {
  id: string;
  name: string;
  iconSrc: string;
  exampleBookCount: number;
  samplePrompt: string;
  description: string;
}

export type GenerationPhase = 'idle' | 'planning' | 'generating' | 'completed' | 'error';

export interface CreateBookPayload {
  prompt: string;
  ageGroup: AgeGroupId;
  pageCount: number;
  referenceImage?: string | null;
  paperSize?: PaperSize;
  orientation?: Orientation;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}
