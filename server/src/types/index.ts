export type AgeGroup = 'kids' | 'children' | 'teens' | 'teen_plus';

export type BookStatus = 'draft' | 'planning' | 'generating' | 'completed' | 'failed' | 'cancelled';

export type PageStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface CreateBookInput {
  prompt: string;
  ageGroup: AgeGroup;
  pageCount: number;
  referenceImage?: string | null;
  paperSize?: string;
  orientation?: string;
}

export interface BookPageDTO {
  id: string;
  bookId: string;
  pageNumber: number;
  concept: string;
  imageUrl: string;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookDTO {
  id: string;
  prompt: string;
  ageGroup: AgeGroup;
  pageCount: number;
  referenceImageUrl?: string | null;
  status: BookStatus;
  paperSize?: string;
  orientation?: string;
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
