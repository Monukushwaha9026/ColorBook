import { BookService } from '../book.service.js';
import { ImageProviderService } from '../image/image-provider.service.js';
import { imageStorage } from '../storage/local-image-storage.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { BookDTO, BookPageDTO } from '../../types/index.js';

interface ActiveJob {
  abortController: AbortController;
  cancelled: boolean;
}

export class BookGenerationService {
  private static activeJobs: Map<string, ActiveJob> = new Map();

  /**
   * Starts background generation of coloring pages for a planned book
   */
  static async startBookGeneration(bookId: string): Promise<void> {
    const book = await BookService.getBookById(bookId);
    if (!book) {
      throw new AppError('Coloring book not found.', 404, 'NOT_FOUND');
    }

    // Prevent duplicate concurrent generation jobs for the same book
    if (this.activeJobs.has(bookId)) {
      console.log(`[BookGenerationService] Generation already in progress for book: ${bookId}`);
      return;
    }

    // If the book does not have pages planned yet, plan it first
    let currentPages = book.pages || [];
    if (currentPages.length === 0) {
      console.log(`[BookGenerationService] Book ${bookId} has no pages; planning book with AI first...`);
      const planned = await BookService.planBook(bookId);
      currentPages = planned.pages;
    }

    // Update status to generating
    await BookService.updateBookStatus(bookId, 'generating');

    const job: ActiveJob = {
      abortController: new AbortController(),
      cancelled: false,
    };
    this.activeJobs.set(bookId, job);

    // Launch background generation without blocking the HTTP request
    this.processGenerationInBackground(bookId, job).catch((err) => {
      console.error(`[BookGenerationService] Uncaught error during background generation for book ${bookId}:`, err);
    });
  }

  /**
   * Background processor generating pages with controlled concurrency
   */
  private static async processGenerationInBackground(bookId: string, job: ActiveJob): Promise<void> {
    const concurrency = Math.max(1, Number(process.env.IMAGE_GENERATION_CONCURRENCY || 1));
    console.log(`[BookGenerationService] Starting background processing for book ${bookId} (Concurrency: ${concurrency})`);

    try {
      const book = await BookService.getBookById(bookId);
      if (!book) return;

      const pagesToGenerate = (book.pages || []).filter(
        (p) => p.status === 'planned' || p.status === 'generating' || p.status === 'failed'
      );

      // Controlled concurrency queue
      let currentIndex = 0;
      const worker = async () => {
        while (currentIndex < pagesToGenerate.length) {
          if (job.cancelled) {
            console.log(`[BookGenerationService] Generation cancelled for book ${bookId}. Halting worker.`);
            break;
          }

          const page = pagesToGenerate[currentIndex++];
          if (!page) break;

          await this.generateSinglePageInternal(book, page, job);
        }
      };

      // Run up to `concurrency` parallel workers
      const workers = Array.from({ length: Math.min(concurrency, pagesToGenerate.length) }, () => worker());
      await Promise.all(workers);

      // Determine final status
      const updatedBook = await BookService.getBookById(bookId);
      if (job.cancelled) {
        await BookService.updateBookStatus(bookId, 'cancelled');
        console.log(`[BookGenerationService] Book ${bookId} marked as cancelled.`);
      } else if (updatedBook) {
        const completedCount = (updatedBook.pages || []).filter((p) => p.status === 'completed').length;
        const failedCount = (updatedBook.pages || []).filter((p) => p.status === 'failed').length;

        if (completedCount > 0) {
          await BookService.updateBookStatus(bookId, 'completed');
          console.log(`[BookGenerationService] Book ${bookId} completed (${completedCount} pages generated, ${failedCount} failed).`);
        } else {
          await BookService.updateBookStatus(bookId, 'failed');
          console.log(`[BookGenerationService] Book ${bookId} failed (no pages succeeded).`);
        }
      }
    } finally {
      this.activeJobs.delete(bookId);
    }
  }

  /**
   * Internal generator for an individual page
   */
  private static async generateSinglePageInternal(
    book: BookDTO,
    page: BookPageDTO,
    job?: ActiveJob,
    isRegeneration = false
  ): Promise<BookPageDTO> {
    if (job?.cancelled) {
      return page;
    }

    console.log(`[BookGenerationService] Starting generation for Book ${book.id}, Page ${page.pageNumber}...`);
    await BookService.updatePage(book.id, page.pageNumber, {
      status: 'generating',
      failureReason: null,
    });

    try {
      const result = await ImageProviderService.generateValidatedImage({
        bookId: book.id,
        pageNumber: page.pageNumber,
        bookTitle: book.title || undefined,
        theme: book.theme || book.prompt,
        concept: page.concept,
        ageGroup: book.ageGroup,
        difficulty: page.difficulty || undefined,
        visualPrompt: page.visualPrompt || undefined,
        isRegeneration,
      });

      // Save generated image to storage
      const storedUrl = await imageStorage.saveImage(result.image.buffer, book.id, page.pageNumber);

      const updatedPage = await BookService.updatePage(book.id, page.pageNumber, {
        imageUrl: storedUrl,
        status: 'completed',
        generationAttempts: result.attempts,
        validationScore: result.validation.score,
        failureReason: null,
      });

      console.log(`[BookGenerationService] Page ${page.pageNumber} completed and stored at: ${storedUrl}`);
      return updatedPage;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[BookGenerationService] Page ${page.pageNumber} generation failed: ${msg}`);

      return await BookService.updatePage(book.id, page.pageNumber, {
        status: 'failed',
        generationAttempts: 3,
        failureReason: msg,
      });
    }
  }

  /**
   * Regenerate a single page with variation without affecting other pages
   */
  static async regenerateSinglePage(bookId: string, pageNumber: number): Promise<BookPageDTO> {
    const book = await BookService.getBookById(bookId);
    if (!book) {
      throw new AppError('Coloring book not found.', 404, 'NOT_FOUND');
    }

    const page = (book.pages || []).find((p) => p.pageNumber === pageNumber);
    if (!page) {
      throw new AppError(`Page ${pageNumber} not found in this coloring book.`, 404, 'NOT_FOUND');
    }

    console.log(`[BookGenerationService] Individually regenerating page ${pageNumber} for book ${bookId} with fresh variation...`);
    return this.generateSinglePageInternal(book, page, undefined, true);
  }

  /**
   * Cancel an ongoing generation job for a book
   */
  static async cancelBookGeneration(bookId: string): Promise<boolean> {
    const job = this.activeJobs.get(bookId);
    if (job) {
      job.cancelled = true;
      job.abortController.abort();
    }
    await BookService.updateBookStatus(bookId, 'cancelled');
    return true;
  }
}
