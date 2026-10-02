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

bookRouter.get('/', BookController.list);
bookRouter.get('/:id', BookController.getById);
bookRouter.post('/', checkReferenceImageErrors, validate(createBookSchema), BookController.create);
bookRouter.post('/:id/plan', checkReferenceImageErrors, BookController.plan);
bookRouter.post('/:id/pages', BookController.savePages);
bookRouter.delete('/:id', BookController.delete);
