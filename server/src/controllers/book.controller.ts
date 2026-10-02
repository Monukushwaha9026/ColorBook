import type { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/book.service.js';

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
      res.json({ success: true, pages: saved });
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
}
