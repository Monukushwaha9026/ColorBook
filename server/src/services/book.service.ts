import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import type { BookDTO, CreateBookInput, BookPageDTO, BookStatus } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { BookPlannerService } from './ai/book-planner.service.js';
import { imageStorage } from './storage/local-image-storage.js';
import { pdfStorage } from './pdf/pdf-storage.js';

// Local storage fallback repository when PostgreSQL database is not actively running
const memoryBooks: Map<string, BookDTO> = new Map();
const memoryPages: Map<string, BookPageDTO[]> = new Map();
let isDbAvailable: boolean | null = null;

const DB_FILE = path.resolve(process.cwd(), 'storage', 'books-db.json');

function restoreDb(): void {
  try {
    if (fsSync.existsSync(DB_FILE)) {
      const raw = fsSync.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.books)) {
        for (const b of data.books) memoryBooks.set(b.id, b);
      }
      if (data.pages && typeof data.pages === 'object') {
        for (const [id, pages] of Object.entries(data.pages)) {
          memoryPages.set(id, pages as BookPageDTO[]);
        }
      }
    }
  } catch {
    // Non-fatal if parsing fails
  }
}

async function persistDb(): Promise<void> {
  try {
    const dir = path.dirname(DB_FILE);
    await fs.mkdir(dir, { recursive: true });
    const payload = {
      books: Array.from(memoryBooks.values()),
      pages: Object.fromEntries(memoryPages.entries()),
    };
    await fs.writeFile(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Non-fatal
  }
}

restoreDb();

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
    const now = input.createdAt || new Date().toISOString();

    // If referenceImage is provided as a data URL or path, normalize reference path
    let referenceImageUrl: string | null = null;
    if (input.referenceImage) {
      if (input.referenceImage.startsWith('data:')) {
        try {
          referenceImageUrl = await imageStorage.saveReferenceImage(id, input.referenceImage);
        } catch {
          referenceImageUrl = null;
        }
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
      pdfUrl: null,
      pdfStatus: 'not_started',
      pages: [],
      createdAt: now,
      updatedAt: now,
    };

    memoryBooks.set(id, newBook);
    persistDb().catch(() => {});

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
            pdfUrl: null,
            pdfStatus: 'not_started',
            createdAt: new Date(newBook.createdAt),
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
    const raw = await tryDb(
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

    if (!raw) return null;

    const activePages = (raw.pages || []).filter((p) => p.status !== 'deleted');
    const completedPages = activePages.filter((p) => p.status === 'completed').length;
    return {
      ...raw,
      pages: activePages,
      completedPages,
    };
  }

  /**
   * Update book status
   */
  static async updateBookStatus(id: string, status: BookStatus): Promise<void> {
    const book = memoryBooks.get(id);
    if (book) {
      book.status = status;
      book.updatedAt = new Date().toISOString();
      persistDb().catch(() => {});
    }

    await tryDb(
      async () => {
        await prisma.book.update({
          where: { id },
          data: { status },
        });
      },
      () => {}
    );
  }

  /**
   * Update PDF metadata for a book
   */
  static async updateBookPdfInfo(
    id: string,
    data: {
      pdfUrl?: string | null;
      pdfStatus?: 'not_started' | 'generating' | 'completed' | 'failed' | 'stale';
      paperSize?: string;
      orientation?: string;
    }
  ): Promise<void> {
    const book = memoryBooks.get(id);
    if (book) {
      if (data.pdfUrl !== undefined) book.pdfUrl = data.pdfUrl;
      if (data.pdfStatus !== undefined) book.pdfStatus = data.pdfStatus;
      if (data.paperSize !== undefined) book.paperSize = data.paperSize;
      if (data.orientation !== undefined) book.orientation = data.orientation;
      book.updatedAt = new Date().toISOString();
      persistDb().catch(() => {});
    }

    await tryDb(
      async () => {
        await prisma.book.update({
          where: { id },
          data: {
            pdfUrl: data.pdfUrl,
            pdfStatus: data.pdfStatus,
            paperSize: data.paperSize,
            orientation: data.orientation,
          },
        });
      },
      () => {}
    );
  }

  /**
   * Update an individual page in a book
   */
  static async updatePage(
    bookId: string,
    pageNumber: number,
    data: Partial<BookPageDTO>
  ): Promise<BookPageDTO> {
    const pages = memoryPages.get(bookId) || [];
    let page = pages.find((p) => p.pageNumber === pageNumber);

    const now = new Date().toISOString();
    if (!page) {
      page = {
        id: `page_${Math.random().toString(36).substring(2, 8)}${Date.now().toString(36)}`,
        bookId,
        pageNumber,
        concept: data.concept || 'Coloring page',
        title: data.title || `Page ${pageNumber}`,
        visualPrompt: data.visualPrompt || null,
        difficulty: data.difficulty || null,
        imageUrl: data.imageUrl || null,
        status: data.status || 'planned',
        generationAttempts: data.generationAttempts || 0,
        validationScore: data.validationScore || null,
        failureReason: data.failureReason || null,
        createdAt: now,
        updatedAt: now,
      };
      pages.push(page);
      memoryPages.set(bookId, pages);
    } else {
      Object.assign(page, data, { updatedAt: now });
    }

    const book = memoryBooks.get(bookId);
    if (book) {
      book.pages = pages.filter((p) => p.status !== 'deleted');
      book.completedPages = book.pages.filter((p) => p.status === 'completed').length;
    }
    persistDb().catch(() => {});

    await tryDb(
      async () => {
        await prisma.bookPage.upsert({
          where: {
            bookId_pageNumber: { bookId, pageNumber },
          },
          update: {
            title: data.title !== undefined ? data.title : page?.title,
            concept: data.concept !== undefined ? data.concept : page?.concept,
            visualPrompt: data.visualPrompt !== undefined ? data.visualPrompt : page?.visualPrompt,
            difficulty: data.difficulty !== undefined ? data.difficulty : page?.difficulty,
            imageUrl: data.imageUrl !== undefined ? data.imageUrl : page?.imageUrl,
            status: data.status !== undefined ? (data.status as any) : page?.status,
            generationAttempts: data.generationAttempts !== undefined ? data.generationAttempts : page?.generationAttempts,
            validationScore: data.validationScore !== undefined ? data.validationScore : page?.validationScore,
            failureReason: data.failureReason !== undefined ? data.failureReason : page?.failureReason,
          },
          create: {
            id: page!.id,
            bookId,
            pageNumber,
            title: page?.title || null,
            concept: page?.concept || 'Coloring page',
            visualPrompt: page?.visualPrompt || null,
            difficulty: page?.difficulty || null,
            imageUrl: page?.imageUrl || null,
            status: (page?.status || 'planned') as any,
            generationAttempts: page?.generationAttempts || 0,
            validationScore: page?.validationScore || null,
            failureReason: page?.failureReason || null,
          },
        });
      },
      () => {}
    );

    return page;
  }

  /**
   * Delete an individual page and renumber remaining pages
   */
  static async deletePage(
    bookId: string,
    pageNumber: number
  ): Promise<{ success: boolean; pageCount: number; pages: BookPageDTO[]; remainingPages: BookPageDTO[]; book: BookDTO }> {
    const book = await this.getBookById(bookId);
    if (!book) {
      throw new AppError('Coloring book not found.', 404, 'NOT_FOUND');
    }

    const pages = memoryPages.get(bookId) || [];
    const targetIdx = pages.findIndex((p) => p.pageNumber === pageNumber && p.status !== 'deleted');
    if (targetIdx === -1) {
      throw new AppError(`Page ${pageNumber} not found in this book.`, 404, 'NOT_FOUND');
    }

    // Mark deleted
    pages[targetIdx].status = 'deleted';

    // Renumber remaining active pages
    const activePages = pages.filter((p) => p.status !== 'deleted');
    activePages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });

    memoryPages.set(bookId, activePages);
    if (book) {
      book.pages = activePages;
      book.pageCount = activePages.length;
      book.completedPages = activePages.filter((p) => p.status === 'completed').length;
      memoryBooks.set(bookId, book);
    }
    persistDb().catch(() => {});

    await tryDb(
      async () => {
        await prisma.bookPage.deleteMany({
          where: { bookId, pageNumber },
        });

        await prisma.book.update({
          where: { id: bookId },
          data: { pageCount: activePages.length },
        });

        await prisma.bookPage.deleteMany({ where: { bookId } });
        for (const p of activePages) {
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
              status: p.status as any,
              generationAttempts: p.generationAttempts || 0,
              validationScore: p.validationScore || null,
              failureReason: p.failureReason || null,
            },
          });
        }
      },
      () => {}
    );

    return {
      success: true,
      pageCount: activePages.length,
      pages: activePages,
      remainingPages: activePages,
      book,
    };
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
        if (dbBooks) {
          return dbBooks.map((b) => {
            const activePages = (b.pages || []).filter((p) => p.status !== 'deleted');
            const completedPages = activePages.filter((p) => p.status === 'completed').length;
            const coverImage = activePages.find((p) => p.imageUrl)?.imageUrl || null;
            return {
              ...b,
              pages: activePages,
              completedPages,
              coverImage,
            };
          }) as unknown as BookDTO[];
        }
        return Array.from(memoryBooks.values())
          .map((b) => {
            const pages = (memoryPages.get(b.id) || []).filter((p) => p.status !== 'deleted');
            return {
              ...b,
              pages,
              completedPages: pages.filter((p) => p.status === 'completed').length,
              coverImage: pages.find((p) => p.imageUrl)?.imageUrl || null,
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      () => {
        return Array.from(memoryBooks.values())
          .map((b) => {
            const pages = (memoryPages.get(b.id) || []).filter((p) => p.status !== 'deleted');
            return {
              ...b,
              pages,
              completedPages: pages.filter((p) => p.status === 'completed').length,
              coverImage: pages.find((p) => p.imageUrl)?.imageUrl || null,
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    );
  }

  /**
   * Find books created within a specific timestamp range (inclusive)
   */
  static async findBooksByDateRange(start: Date, end: Date): Promise<BookDTO[]> {
    return tryDb(
      async () => {
        const dbBooks = await prisma.book.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: { pages: { orderBy: { pageNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        });
        return (dbBooks || []).map((b) => {
          const activePages = (b.pages || []).filter((p) => p.status !== 'deleted');
          const completedPages = activePages.filter((p) => p.status === 'completed').length;
          const coverImage = activePages.find((p) => p.imageUrl)?.imageUrl || null;
          return {
            ...b,
            pages: activePages,
            completedPages,
            coverImage,
          };
        }) as unknown as BookDTO[];
      },
      () => {
        const matching: BookDTO[] = [];
        for (const [id, book] of memoryBooks.entries()) {
          const created = new Date(book.createdAt);
          if (created >= start && created <= end) {
            const pages = (memoryPages.get(id) || []).filter((p) => p.status !== 'deleted');
            const completedPages = pages.filter((p) => p.status === 'completed').length;
            const coverImage = pages.find((p) => p.imageUrl)?.imageUrl || null;
            matching.push({
              ...book,
              pages,
              completedPages,
              coverImage,
            });
          }
        }
        return matching.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
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
    persistDb().catch(() => {});

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
      generationAttempts: 0,
      validationScore: null,
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    }));

    book.title = plan.title;
    book.theme = plan.theme;
    book.styleDirection = plan.styleDirection;
    book.status = 'generating';
    book.pages = plannedPages;
    book.completedPages = 0;
    book.updatedAt = now;

    memoryBooks.set(bookId, book);
    memoryPages.set(bookId, plannedPages);
    persistDb().catch(() => {});

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
        await prisma.bookPage.deleteMany({ where: { bookId: id } });
        await prisma.book.delete({ where: { id } });
      },
      () => {}
    );
    memoryPages.delete(id);
    const deleted = memoryBooks.delete(id);
    persistDb().catch(() => {});

    // Thorough cleanup of all local disk storage for the deleted book
    await imageStorage.deleteReferenceImage(id);
    await imageStorage.deleteBookImages(id);
    await pdfStorage.deletePdf(id);

    return deleted;
  }
}
