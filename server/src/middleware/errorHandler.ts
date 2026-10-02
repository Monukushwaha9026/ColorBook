import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'VALIDATION_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    let errorCode = 'VALIDATION_ERROR';

    if (firstError?.path.includes('prompt')) {
      errorCode = 'INVALID_PROMPT';
    } else if (firstError?.path.includes('ageGroup')) {
      errorCode = 'INVALID_AGE_GROUP';
    } else if (firstError?.path.includes('pageCount')) {
      errorCode = 'INVALID_PAGE_COUNT';
    } else if (firstError?.path.includes('referenceImage')) {
      errorCode = 'INVALID_REFERENCE_IMAGE';
    }

    res.status(400).json({
      success: false,
      error: {
        code: errorCode,
        message: firstError?.message || 'Invalid input data.',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // 2. Custom App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // 3. Payload Too Large (e.g., Express body limit exceeded)
  if (typeof err === 'object' && err !== null && 'type' in err && (err as { type: string }).type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Uploaded payload or image exceeds the allowed size limit.',
      },
    });
    return;
  }

  // 4. General Server Errors (Don't expose internal stack traces to the client)
  console.error('[Internal Server Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Something went wrong while processing your request. Please try again.',
    },
  });
}
