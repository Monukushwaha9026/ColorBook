import { Router } from 'express';
import { z } from 'zod';
import { BookController } from '../controllers/book.controller.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

export const bookRouter = Router();

// Validation schema for creating a coloring book
const createBookSchema = z.object({
  prompt: z
    .string({ required_error: "Please describe what you'd like in your coloring book." })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: "Please describe what you'd like in your coloring book.",
    })
    .refine((val) => val.length <= 500, {
      message: 'Prompt cannot exceed 500 characters.',
    }),

  ageGroup: z.enum(['kids', 'children', 'teens', 'teen_plus'], {
    errorMap: () => ({
      message: 'Age group must be one of: kids, children, teens, teen_plus.',
    }),
  }),

  pageCount: z
    .number({ required_error: 'Page count is required.' })
    .int('Page count must be a whole number.')
    .min(1, 'Page count must be between 1 and 10.')
    .max(10, 'Page count must be between 1 and 10.'),

  referenceImage: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val || !val.startsWith('data:')) return true;
        // Validate MIME type
        const match = val.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        if (!match) return false;
        const mime = match[1].toLowerCase();
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime);
      },
      {
        message: 'Invalid image format. Supported formats are JPG, JPEG, PNG, and WebP.',
      }
    )
    .refine(
      (val) => {
        if (!val) return true;
        // Validate max base64 size (approx 7MB base64 is ~5MB binary file)
        return val.length <= 7 * 1024 * 1024;
      },
      {
        message: 'Reference image size exceeds 5MB limit.',
      }
    ),
});

// Middleware to check image error code specifically
function checkReferenceImageErrors(req: any, _res: any, next: any) {
  const { referenceImage } = req.body || {};
  if (typeof referenceImage === 'string' && referenceImage.startsWith('data:')) {
    const match = referenceImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!match) {
      throw new AppError('Invalid image data URL format.', 400, 'INVALID_IMAGE_TYPE');
    }
    const mime = match[1].toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime)) {
      throw new AppError('Please choose a JPG, PNG, or WebP image.', 400, 'INVALID_IMAGE_TYPE');
    }
    if (referenceImage.length > 7 * 1024 * 1024) {
      throw new AppError('Reference image exceeds the allowed file size.', 413, 'FILE_TOO_LARGE');
    }
  }
  next();
}

// Middleware to validate safe book identifier
function validateBookId(req: any, _res: any, next: any) {
  const id = String(req.params.id || req.params.bookId || '');
  if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    throw new AppError('Invalid coloring book identifier.', 400, 'INVALID_BOOK_ID');
  }
  next();
}

// Middleware to validate positive page number
function validatePageNumber(req: any, _res: any, next: any) {
  const pageNum = Number(req.params.pageNumber);
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 100 || !Number.isInteger(pageNum)) {
    throw new AppError('Invalid page number parameter.', 400, 'INVALID_PAGE_NUMBER');
  }
  next();
}

import { createRateLimiter } from '../middleware/rateLimiter.js';

const generateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many book generation requests. Please wait a minute before starting another job.',
});

const regenerateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many page regeneration requests. Please wait a moment before trying again.',
});

const pdfLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many PDF compilation requests. Please wait a moment before trying again.',
});

const generatePdfSchema = z.object({
  paperSize: z
    .enum(['A4', 'LETTER', 'a4', 'letter', 'US Letter', 'US_LETTER'], {
      errorMap: () => ({ message: 'Invalid paper size. Must be A4 or LETTER.' }),
    })
    .optional(),
  orientation: z
    .enum(['PORTRAIT', 'LANDSCAPE', 'portrait', 'landscape'], {
      errorMap: () => ({ message: 'Invalid orientation. Must be portrait or landscape.' }),
    })
    .optional(),
});

bookRouter.get('/', BookController.list);
bookRouter.get('/:id', validateBookId, BookController.getById);
bookRouter.post('/', checkReferenceImageErrors, validate(createBookSchema), BookController.create);
bookRouter.post('/:id/plan', validateBookId, checkReferenceImageErrors, BookController.plan);
bookRouter.post('/:id/generate', validateBookId, generateLimiter, BookController.generate);
bookRouter.post('/:id/cancel', validateBookId, BookController.cancel);
bookRouter.post('/:id/pages/:pageNumber/regenerate', validateBookId, validatePageNumber, regenerateLimiter, BookController.regeneratePage);
bookRouter.delete('/:id/pages/:pageNumber', validateBookId, validatePageNumber, BookController.deletePage);
bookRouter.post('/:id/pages', validateBookId, BookController.savePages);
bookRouter.post('/:id/pdf', validateBookId, pdfLimiter, validate(generatePdfSchema), BookController.generatePdf);
bookRouter.get('/:id/pdf', validateBookId, BookController.downloadPdf);
bookRouter.delete('/:id', validateBookId, BookController.delete);
