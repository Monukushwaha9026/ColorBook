import { prisma } from '../lib/prisma.js';
import type { BookDTO, CreateBookInput, BookPageDTO } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { BookPlannerService } from './ai/book-planner.service.js';

// In-memory fallback repository when PostgreSQL database is not actively running
const memoryBooks: Map<string, BookDTO> = new Map();
const memoryPages: Map<string, BookPageDTO[]> = new Map();
let isDbAvailable: boolean | null = null;

async function tryDb<T>(op: () => Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
  if (isDbAvailable === false) {
    return fallback();
  }
  try {
    const res = await op();
    isDbAvailable = true;
    return res;
  } catch {
    isDbAvailable = false;
    return fallback();
  }
}

export class BookService {
  /**
   * Create a new coloring book job with status 'planning'
   */
  static async createBook(input: CreateBookInput): Promise<BookDTO> {
    const id = `book_${Math.random().toString(36).substring(2, 8)}${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    // If referenceImage is provided as a data URL or path, normalize reference path
    let referenceImageUrl: string | null = null;
    if (input.referenceImage) {
      if (input.referenceImage.startsWith('data:')) {
        // Mock stored reference path (avoiding raw megabytes in PostgreSQL table)
        referenceImageUrl = `/uploads/references/${id}.png`;
      } else {
        referenceImageUrl = input.referenceImage;
      }
    }

    const newBook: BookDTO = {
      id,
      prompt: input.prompt.trim(),
      ageGroup: input.ageGroup,
      pageCount: input.pageCount,
      referenceImageUrl,
      status: 'planning', // Status set to 'planning' as specified in Step 2 requirements
      paperSize: input.paperSize || 'A4',
      orientation: input.orientation || 'PORTRAIT',
      pages: [],
      createdAt: now,
      updatedAt: now,
    };

    memoryBooks.set(id, newBook);

    return tryDb(
      async () => {
        const dbBook = await prisma.book.create({
          data: {
            id: newBook.id,
            prompt: newBook.prompt,
            ageGroup: newBook.ageGroup,
            pageCount: newBook.pageCount,
            referenceImageUrl: newBook.referenceImageUrl,
            status: 'planning',
            paperSize: newBook.paperSize || 'A4',
            orientation: newBook.orientation || 'PORTRAIT',
          },
          include: { pages: true },
        });
        return dbBook as unknown as BookDTO;
      },
      () => newBook
    );
  }

  /**
   * Get book by unique ID including its pages
   */
  static async getBookById(id: string): Promise<BookDTO | null> {
    return tryDb(
      async () => {
        const dbBook = await prisma.book.findUnique({
          where: { id },
          include: { pages: { orderBy: { pageNumber: 'asc' } } },
        });
        if (dbBook) return dbBook as unknown as BookDTO;
        const book = memoryBooks.get(id);
        if (!book) return null;
        const pages = memoryPages.get(id) || [];
        return { ...book, pages };
      },
      () => {
        const book = memoryBooks.get(id);
        if (!book) return null;
        const pages = memoryPages.get(id) || [];
        return { ...book, pages };
      }
    );
  }

  /**
   * List all books sorted by creation date
   */
  static async listBooks(): Promise<BookDTO[]> {
    return tryDb(
      async () => {
        const dbBooks = await prisma.book.findMany({
          include: { pages: { orderBy: { pageNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        });
        if (dbBooks && dbBooks.length > 0) return dbBooks as unknown as BookDTO[];
        return Array.from(memoryBooks.values())
          .map((b) => ({ ...b, pages: memoryPages.get(b.id) || [] }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      () => {
        return Array.from(memoryBooks.values())
          .map((b) => ({ ...b, pages: memoryPages.get(b.id) || [] }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    );
  }

  /**
   * Save or update pages for a book
   */
  static async savePages(bookId: string, pages: BookPageDTO[]): Promise<BookPageDTO[]> {
    memoryPages.set(bookId, pages);
    const book = memoryBooks.get(bookId);
    if (book) {
      book.status = 'completed';
      book.pages = pages;
    }

    await tryDb(
      async () => {
        await prisma.book.update({
          where: { id: bookId },
          data: { status: 'completed' },
        });

        for (const p of pages) {
          await prisma.bookPage.upsert({
            where: {
              bookId_pageNumber: {
                bookId,
                pageNumber: p.pageNumber,
              },
            },
            update: {
              title: p.title,
              concept: p.concept,
              visualPrompt: p.visualPrompt,
              difficulty: p.difficulty,
              imageUrl: p.imageUrl,
              status: p.status,
            },
            create: {
              id: p.id,
              bookId,
              pageNumber: p.pageNumber,
              title: p.title,
              concept: p.concept,
              visualPrompt: p.visualPrompt,
              difficulty: p.difficulty,
              imageUrl: p.imageUrl,
              status: p.status,
            },
          });
        }
      },
      () => {}
    );

    return pages;
  }

  /**
   * Plan a coloring book using the AI Book Planner
   */
  static async planBook(bookId: string, referenceImage?: string | null): Promise<{ book: BookDTO; pages: BookPageDTO[] }> {
    const book = await this.getBookById(bookId);
    if (!book) {
      throw new AppError('Coloring book not found.', 404, 'NOT_FOUND');
    }

    // Update status to planning
    book.status = 'planning';
    memoryBooks.set(bookId, book);
    await tryDb(
      async () => {
        await prisma.book.update({
          where: { id: bookId },
          data: { status: 'planning' },
        });
      },
      () => {}
    );

    // Call BookPlannerService
    const plan = await BookPlannerService.planBook(
      {
        prompt: book.prompt,
        ageGroup: book.ageGroup,
        pageCount: book.pageCount,
        referenceImage: referenceImage || book.referenceImageUrl,
      },
      bookId
    );

    const now = new Date().toISOString();
    const plannedPages: BookPageDTO[] = plan.pages.map((p) => ({
      id: `page_${Math.random().toString(36).substring(2, 8)}${Date.now().toString(36)}`,
      bookId,
      pageNumber: p.pageNumber,
      title: p.title,
      concept: p.concept,
      visualPrompt: p.visualPrompt,
      difficulty: p.difficulty,
      imageUrl: null,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    }));

    book.title = plan.title;
    book.theme = plan.theme;
    book.styleDirection = plan.styleDirection;
    book.status = 'generating';
    book.pages = plannedPages;
    book.updatedAt = now;

    memoryBooks.set(bookId, book);
    memoryPages.set(bookId, plannedPages);

    await tryDb(
      async () => {
        await prisma.book.update({
          where: { id: bookId },
          data: {
            title: plan.title,
            theme: plan.theme,
            styleDirection: plan.styleDirection,
            status: 'generating',
          },
        });

        await prisma.bookPage.deleteMany({ where: { bookId } });
        for (const p of plannedPages) {
          await prisma.bookPage.create({
            data: {
              id: p.id,
              bookId,
              pageNumber: p.pageNumber,
              title: p.title,
              concept: p.concept,
              visualPrompt: p.visualPrompt,
              difficulty: p.difficulty,
              imageUrl: p.imageUrl,
              status: 'planned',
            },
          });
        }
      },
      () => {}
    );

    return { book, pages: plannedPages };
  }

  /**
   * Delete a book by ID
   */
  static async deleteBook(id: string): Promise<boolean> {
    await tryDb(
      async () => {
        await prisma.book.delete({ where: { id } });
      },
      () => {}
    );
    memoryPages.delete(id);
    return memoryBooks.delete(id);
  }
}
