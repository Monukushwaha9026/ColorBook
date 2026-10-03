import type { CreateBookPayload, AgeGroupId, BookStatus, ColoringPageItem, Book, PlanBookResponse, PaperSize, Orientation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiClientError extends Error {
  code: string;
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, code = 'API_ERROR', details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      const err = data.error || {};
      throw new ApiClientError(
        err.message || `Request failed with status ${res.status}`,
        err.code || `HTTP_${res.status}`,
        err.details
      );
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiClientError(
      message.includes('Failed to fetch')
        ? 'Could not connect to the backend server. Please verify the server is running.'
        : message,
      'NETWORK_ERROR'
    );
  }
}

export interface CreateBookResponse {
  success: boolean;
  book: {
    id: string;
    prompt: string;
    ageGroup: AgeGroupId;
    pageCount: number;
    status: BookStatus;
    referenceImageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface GetBookResponse {
  success: boolean;
  book: Book;
}

export interface RegeneratePageResponse {
  success: boolean;
  page: {
    id: string;
    bookId: string;
    pageNumber: number;
    concept: string;
    imageUrl: string;
    status: string;
  };
}

export const api = {
  /**
   * Create a new coloring book job (initial status: planning)
   */
  async createBook(payload: CreateBookPayload): Promise<CreateBookResponse> {
    return request<CreateBookResponse>('/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Request Gemini AI to plan the book's storyline, pages, and line-art prompts
   */
  async planBook(bookId: string, referenceImage?: string | null): Promise<PlanBookResponse> {
    return request<PlanBookResponse>(`/books/${bookId}/plan`, {
      method: 'POST',
      body: JSON.stringify({ referenceImage }),
    });
  },

  /**
   * Fetch book details by ID
   */
  async getBook(id: string): Promise<GetBookResponse> {
    return request<GetBookResponse>(`/books/${id}`);
  },

  /**
   * Save or update generated pages for a book
   */
  async saveBookPages(bookId: string, pages: ColoringPageItem[]): Promise<{ success: boolean; pages: ColoringPageItem[] }> {
    return request<{ success: boolean; pages: ColoringPageItem[] }>(`/books/${bookId}/pages`, {
      method: 'POST',
      body: JSON.stringify({ pages }),
    });
  },

  /**
   * Start asynchronous image generation for a planned book
   */
  async startGeneration(bookId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/books/${bookId}/generate`, {
      method: 'POST',
    });
  },

  /**
   * Cancel an ongoing book generation job
   */
  async cancelGeneration(bookId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/books/${bookId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Delete an individual page and renumber remaining pages
   */
  async deletePage(bookId: string, pageNumber: number): Promise<{ success: boolean; remainingPages: ColoringPageItem[] }> {
    return request<{ success: boolean; remainingPages: ColoringPageItem[] }>(`/books/${bookId}/pages/${pageNumber}`, {
      method: 'DELETE',
    });
  },

  /**
   * Regenerate a single coloring page without regenerating the entire book
   */
  async regeneratePage(bookId: string, pageNumber: number, concept?: string): Promise<RegeneratePageResponse> {
    return request<RegeneratePageResponse>(`/books/${bookId}/pages/${pageNumber}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ concept }),
    });
  },

  /**
   * List all coloring books
   */
  async listBooks(): Promise<{ success: boolean; books: Book[] }> {
    return request<{ success: boolean; books: Book[] }>('/books');
  },

  /**
   * Generate a printable PDF for a book
   */
  async generatePdf(
    bookId: string,
    payload: { paperSize?: PaperSize; orientation?: Orientation } = {}
  ): Promise<{ success: boolean; pdfUrl: string; pageCount: number; message: string }> {
    return request<{ success: boolean; pdfUrl: string; pageCount: number; message: string }>(`/books/${bookId}/pdf`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a book by ID
   */
  async deleteBook(bookId: string): Promise<{ success: boolean; deleted: boolean }> {
    return request<{ success: boolean; deleted: boolean }>(`/books/${bookId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get direct download URL for the book's PDF
   */
  getPdfDownloadUrl(bookId: string): string {
    return `${API_BASE_URL}/books/${bookId}/pdf`;
  },
};
