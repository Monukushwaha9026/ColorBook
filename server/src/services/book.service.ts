import { prisma } from '../lib/prisma.js';
import type { BookDTO, CreateBookInput, BookPageDTO } from '../types/index.js';

// In-memory fallback repository when PostgreSQL database is not actively running
const memoryBooks: Map<string, BookDTO> = new Map();
const memoryPages: Map<string, BookPageDTO[]> = new Map();

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

    try {
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

      // Synchronize in-memory mirror
      memoryBooks.set(id, newBook);
      return dbBook as unknown as BookDTO;
    } catch {
      // In-memory storage fallback
      memoryBooks.set(id, newBook);
      return newBook;
    }
  }

  /**
   * Get book by unique ID including its pages
   */
  static async getBookById(id: string): Promise<BookDTO | null> {
    try {
      const dbBook = await prisma.book.findUnique({
        where: { id },
        include: { pages: { orderBy: { pageNumber: 'asc' } } },
      });
      if (dbBook) return dbBook as unknown as BookDTO;
    } catch {
      // Fallback
    }

    const book = memoryBooks.get(id);
    if (!book) return null;
    const pages = memoryPages.get(id) || [];
    return { ...book, pages };
  }

  /**
   * List all books sorted by creation date
   */
  static async listBooks(): Promise<BookDTO[]> {
    try {
      const dbBooks = await prisma.book.findMany({
        include: { pages: { orderBy: { pageNumber: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
      if (dbBooks && dbBooks.length > 0) return dbBooks as unknown as BookDTO[];
    } catch {
      // Fallback
    }

    return Array.from(memoryBooks.values())
      .map((b) => ({ ...b, pages: memoryPages.get(b.id) || [] }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Save or update pages for a book
   */
  static async savePages(bookId: string, pages: BookPageDTO[]): Promise<BookPageDTO[]> {
    memoryPages.set(bookId, pages);

    try {
      // Update book status to completed or generating
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
            concept: p.concept,
            imageUrl: p.imageUrl,
            status: p.status,
          },
          create: {
            id: p.id,
            bookId,
            pageNumber: p.pageNumber,
            concept: p.concept,
            imageUrl: p.imageUrl,
            status: p.status,
          },
        });
      }
    } catch {
      // In-memory fallback
      const book = memoryBooks.get(bookId);
      if (book) {
        book.status = 'completed';
        book.pages = pages;
      }
    }

    return pages;
  }

  /**
   * Delete a book by ID
   */
  static async deleteBook(id: string): Promise<boolean> {
    try {
      await prisma.book.delete({ where: { id } });
    } catch {
      // Ignored
    }
    memoryPages.delete(id);
    return memoryBooks.delete(id);
  }
}
