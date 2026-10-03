import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/book.service.js';
import { BookGenerationService } from '../services/ai/book-generation.service.js';
import { PdfGeneratorService } from '../services/pdf/pdf-generator.service.js';
import { pdfStorage } from '../services/pdf/pdf-storage.js';
import { AppError } from '../middleware/errorHandler.js';

export class BookController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const books = await BookService.listBooks();
      res.json({ success: true, books });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const book = await BookService.getBookById(id);
      if (!book) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Coloring book not found.',
          },
        });
        return;
      }
      res.json({ success: true, book });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.createBook(req.body);
      res.status(201).json({
        success: true,
        book: {
          id: book.id,
          prompt: book.prompt,
          ageGroup: book.ageGroup,
          pageCount: book.pageCount,
          referenceImageUrl: book.referenceImageUrl,
          status: book.status,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async savePages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { pages } = req.body;
      const saved = await BookService.savePages(id, pages);
      await BookService.updateBookPdfInfo(id, { pdfStatus: 'stale' });
      res.json({ success: true, pages: saved });
    } catch (err) {
      next(err);
    }
  }

  static async plan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const referenceImage = req.body?.referenceImage || null;
      const result = await BookService.planBook(id, referenceImage);
      res.json({
        success: true,
        book: result.book,
        pages: result.pages,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Start image generation for a planned book
   */
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await BookGenerationService.startBookGeneration(id);
      res.json({
        success: true,
        message: 'Book generation started.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel generation for a book
   */
  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await BookGenerationService.cancelBookGeneration(id);
      res.json({
        success: true,
        message: 'Book generation cancelled.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Regenerate an individual page
   */
  static async regeneratePage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookId = String(req.params.id || req.params.bookId);
      const pageNumber = Number(req.params.pageNumber || req.params.pageId);
      const page = await BookGenerationService.regenerateSinglePage(bookId, pageNumber);
      // Invalidate PDF because book artwork has changed
      await BookService.updateBookPdfInfo(bookId, { pdfStatus: 'stale' });
      res.json({
        success: true,
        page,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an individual page
   */
  static async deletePage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookId = String(req.params.id || req.params.bookId);
      const pageNumber = Number(req.params.pageNumber || req.params.pageId);
      const result = await BookService.deletePage(bookId, pageNumber);
      // Invalidate PDF because pages have changed
      await BookService.updateBookPdfInfo(bookId, { pdfStatus: 'stale' });
      res.json({
        success: true,
        remainingPages: result.remainingPages,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const deleted = await BookService.deleteBook(id);
      res.json({ success: true, deleted });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generate a printable PDF from completed pages
   */
  static async generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookId = String(req.params.id);
      const { paperSize, orientation } = req.body || {};

      const result = await PdfGeneratorService.generateBookPdf({
        bookId,
        paperSize,
        orientation,
      });

      res.json({
        success: true,
        pdfUrl: result.pdfUrl,
        pageCount: result.pageCount,
        pdfStatus: 'completed',
        message: 'Printable PDF generated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download the generated PDF with a safe filename
   */
  static async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookId = String(req.params.id);
      const book = await BookService.getBookById(bookId);

      if (!book) {
        throw new AppError('Coloring book not found.', 404, 'NOT_FOUND');
      }

      if (!pdfStorage.pdfExists(bookId)) {
        throw new AppError('No PDF found for this coloring book. Please generate the PDF first.', 404, 'PDF_NOT_FOUND');
      }

      if (book.pdfStatus === 'stale') {
        throw new AppError('The PDF is outdated because pages were modified. Please regenerate the PDF.', 409, 'PDF_STALE');
      }

      const rawTitle = book.title || book.prompt || 'coloring-book';
      const safeName = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'coloring-book';
      const filename = `${safeName}-coloring-book.pdf`;

      const pdfPath = pdfStorage.getPdfPath(bookId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(path.resolve(pdfPath));
    } catch (err) {
      next(err);
    }
  }
}
