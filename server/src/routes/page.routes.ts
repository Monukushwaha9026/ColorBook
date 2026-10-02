import { Router } from 'express';
import { PageController } from '../controllers/page.controller.js';

export const pageRouter = Router({ mergeParams: true });

// Route when mounted under /api/books/:bookId/pages
pageRouter.post('/:pageNumber/regenerate', PageController.regenerate);

// Top-level standalone page routes
export const standalonePageRouter = Router();
standalonePageRouter.post('/:id/regenerate', PageController.regenerate);
