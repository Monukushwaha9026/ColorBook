export type AgeGroup = 'kids' | 'children' | 'teens' | 'teen_plus';

export type BookStatus = 'draft' | 'planning' | 'generating' | 'completed' | 'failed' | 'cancelled';

export type PageStatus = 'pending' | 'planned' | 'generating' | 'completed' | 'failed' | 'deleted';

export interface CreateBookInput {
  prompt: string;
  ageGroup: AgeGroup;
  pageCount: number;
  referenceImage?: string | null;
  paperSize?: string;
  orientation?: string;
  createdAt?: string;
}

export interface BookPageDTO {
  id: string;
  bookId: string;
  pageNumber: number;
  title?: string | null;
  concept: string;
  visualPrompt?: string | null;
  difficulty?: 'easy' | 'medium' | 'detailed' | 'intricate' | string | null;
  imageUrl?: string | null;
  status: PageStatus;
  generationAttempts?: number;
  validationScore?: number | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookDTO {
  id: string;
  title?: string | null;
  theme?: string | null;
  styleDirection?: string | null;
  prompt: string;
  ageGroup: AgeGroup;
  pageCount: number;
  completedPages?: number;
  coverImage?: string | null;
  referenceImageUrl?: string | null;
  status: BookStatus;
  paperSize?: string;
  orientation?: string;
  pdfUrl?: string | null;
  pdfStatus?: 'not_started' | 'generating' | 'completed' | 'failed' | 'stale';
  pages?: BookPageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  [key: string]: unknown;
}
