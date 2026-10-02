import type { Request, Response, NextFunction } from 'express';
import { PageService } from '../services/page.service.js';

export class PageController {
  static async regenerate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookId = String(req.params.bookId || req.body.bookId || 'temp_book');
      const pageNumber = parseInt(String(req.params.pageNumber || req.body.pageNumber || '1'), 10);
      const customConcept = req.body?.concept as string | undefined;

      const page = await PageService.regeneratePage(bookId, pageNumber, customConcept);
      res.json({ success: true, page });
    } catch (err) {
      next(err);
    }
  }
}
