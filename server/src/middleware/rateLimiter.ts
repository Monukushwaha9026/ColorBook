import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipInTest?: boolean;
}

/**
 * Lightweight, in-memory rate limiter for single-instance MVP deployments.
 * Automatically cleans up expired windows. Bypassed in test environments unless skipInTest is false.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please slow down and try again.', skipInTest = true } = options;
  const clientHits = new Map<string, { count: number; resetTime: number }>();

  // Periodically sweep expired entries to prevent memory leaks
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of clientHits.entries()) {
      if (now > entry.resetTime) {
        clientHits.delete(ip);
      }
    }
  }, windowMs);
  interval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Disable rate limiting in automated test suites unless explicitly tested
    if (skipInTest && (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true')) {
      return next();
    }

    const clientKey = (options.keyGenerator ? options.keyGenerator(req) : req.ip) || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const entry = clientHits.get(clientKey);

    if (!entry || now > entry.resetTime) {
      clientHits.set(clientKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec.toString());
      throw new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
    }

    next();
  };
}
