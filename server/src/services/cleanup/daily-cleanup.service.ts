import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import cron, { type ScheduledTask } from 'node-cron';
import { BookService } from '../book.service.js';
import { imageStorage } from '../storage/local-image-storage.js';
import { pdfStorage } from '../pdf/pdf-storage.js';

export interface DateRange {
  targetDateStr: string; // "YYYY-MM-DD"
  start: Date;           // inclusive start Date in UTC
  end: Date;             // inclusive end Date in UTC
  timezone: string;
}

export interface CleanupResult {
  success: boolean;
  targetDate: string;
  dateRange: {
    startIso: string;
    endIso: string;
  };
  scanned: number;
  deletedBooks: number;
  deletedFiles: number;
  failedBooks: number;
  errors?: Array<{ bookId: string; error: string }>;
}

export interface CleanupOptions {
  targetDate?: string | Date;
}

/**
 * Calculates the exact UTC timestamp boundary for a given calendar day in Asia/Kolkata (IST = UTC+05:30).
 * Range is strictly:
 * 00:00:00.000 IST (inclusive) through 23:59:59.999 IST (inclusive).
 */
export function calculateIstCalendarDayRange(targetDateStr: string): DateRange {
  const match = targetDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date format for IST calendar day: "${targetDateStr}". Expected YYYY-MM-DD.`);
  }

  const [, yStr, mStr, dStr] = match;
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  // IST offset is fixed: UTC + 5 hours 30 minutes (+330 minutes, 19800000 ms)
  const IST_OFFSET_MS = 5.5 * 3600 * 1000;

  // Start instant: YYYY-MM-DD 00:00:00.000 IST
  const startMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS;
  // End instant: YYYY-MM-DD 23:59:59.999 IST
  const endMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - IST_OFFSET_MS;

  return {
    targetDateStr,
    start: new Date(startMs),
    end: new Date(endMs),
    timezone: 'Asia/Kolkata',
  };
}

/**
 * Formats a Date instant into its calendar day representation in Asia/Kolkata (YYYY-MM-DD).
 */
export function formatInIst(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Calculates the previous calendar day range in Asia/Kolkata relative to referenceDate.
 * E.g., if referenceDate is 2026-10-03 at 01:00 IST -> target day is 2026-10-02 (00:00:00.000 to 23:59:59.999 IST).
 */
export function getPreviousIstCalendarDayRange(referenceDate: Date = new Date()): DateRange {
  const currentIstStr = formatInIst(referenceDate);
  const [y, m, d] = currentIstStr.split('-').map(Number);

  // Take noon UTC on current IST date and subtract 24 hours to cleanly get previous calendar day
  const prevDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);

  const prevIstStr = formatInIst(prevDate);
  return calculateIstCalendarDayRange(prevIstStr);
}

/**
 * Counts the actual files present on disk for a given book before deletion.
 */
async function countBookFiles(bookId: string): Promise<number> {
  let fileCount = 0;

  // 1. Check book image files directory
  try {
    const bookImgDir = path.join(imageStorage.getBaseDir(), 'books', bookId);
    if (fsSync.existsSync(bookImgDir)) {
      const entries = await fs.readdir(bookImgDir);
      fileCount += entries.length;
    }
  } catch {
    // Non-fatal
  }

  // 2. Check reference images (extensions: png, jpg, jpeg, webp)
  try {
    const refDir = imageStorage.getReferencesDir();
    if (fsSync.existsSync(refDir)) {
      const extensions = ['png', 'jpg', 'jpeg', 'webp'];
      for (const ext of extensions) {
        const refPath = path.join(refDir, `${bookId}.${ext}`);
        if (fsSync.existsSync(refPath)) {
          fileCount++;
        }
      }
    }
  } catch {
    // Non-fatal
  }

  // 3. Check PDF file
  try {
    const pdfPath = pdfStorage.getPdfPath(bookId);
    if (fsSync.existsSync(pdfPath)) {
      fileCount++;
    }
  } catch {
    // Non-fatal
  }

  return fileCount;
}

export class DailyCleanupService {
  /**
   * Executes the daily data cleanup.
   * If target is provided as a YYYY-MM-DD string, cleans that specific calendar day.
   * If target is provided as a Date, cleans the calendar day preceding that Date in Asia/Kolkata.
   * If target is omitted, cleans the calendar day preceding now in Asia/Kolkata.
   */
  static async executeDailyCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    let range: DateRange;

    if (typeof options.targetDate === 'string') {
      range = calculateIstCalendarDayRange(options.targetDate);
    } else if (options.targetDate instanceof Date) {
      range = getPreviousIstCalendarDayRange(options.targetDate);
    } else {
      range = getPreviousIstCalendarDayRange(new Date());
    }

    console.log('[Cleanup] Starting daily cleanup');
    console.log(`[Cleanup] Target date: ${range.targetDateStr} Asia/Kolkata`);

    let scanned = 0;
    let deletedBooks = 0;
    let deletedFiles = 0;
    let failedBooks = 0;
    const errors: Array<{ bookId: string; error: string }> = [];

    try {
      const books = await BookService.findBooksByDateRange(range.start, range.end);
      scanned = books.length;

      for (const book of books) {
        try {
          // Validate identifier to prevent path traversal
          if (!book.id || !/^[a-zA-Z0-9_-]+$/.test(book.id)) {
            throw new Error(`Invalid book ID format: "${book.id}"`);
          }

          // Count physical files before deleting
          const filesOnDisk = await countBookFiles(book.id);

          // Delete book assets and database records safely
          await BookService.deleteBook(book.id);

          deletedBooks++;
          deletedFiles += filesOnDisk;
        } catch (err: unknown) {
          failedBooks++;
          const message = err instanceof Error ? err.message : String(err);
          errors.push({ bookId: book.id, error: message });
          console.error(`[Cleanup] Failed to delete book ${book.id}: ${message}`);
        }
      }
    } catch (err: unknown) {
      console.error('[Cleanup] Error querying books for cleanup:', err);
    }

    console.log('[Cleanup] Completed');
    console.log(`[Cleanup] Books scanned: ${scanned}`);
    console.log(`[Cleanup] Books deleted: ${deletedBooks}`);
    console.log(`[Cleanup] Failures: ${failedBooks}`);

    return {
      success: failedBooks === 0,
      targetDate: range.targetDateStr,
      dateRange: {
        startIso: range.start.toISOString(),
        endIso: range.end.toISOString(),
      },
      scanned,
      deletedBooks,
      deletedFiles,
      failedBooks,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

let scheduledTask: ScheduledTask | null = null;

/**
 * Starts the daily cleanup scheduler if enabled in the environment.
 * Default schedule: Every day at 01:00 AM IST ('0 1 * * *', timezone 'Asia/Kolkata').
 */
export function startDailyCleanupScheduler(): ScheduledTask | null {
  const isEnabled = process.env.CLEANUP_ENABLED !== 'false';
  const timezone = process.env.CLEANUP_TIMEZONE || 'Asia/Kolkata';
  const cronExpr = process.env.CLEANUP_CRON_SCHEDULE || '0 1 * * *';

  if (!isEnabled) {
    console.log('[Cleanup] Daily cleanup disabled (CLEANUP_ENABLED=false)');
    return null;
  }

  if (!cron.validate(cronExpr)) {
    console.error(`[Cleanup] Invalid cron expression: "${cronExpr}". Scheduler not started.`);
    return null;
  }

  console.log('[Cleanup] Daily cleanup enabled');
  console.log(`[Cleanup] Schedule: 01:00 ${timezone}`);

  scheduledTask = cron.schedule(
    cronExpr,
    async () => {
      console.log('[Cleanup] Triggering scheduled daily cleanup job...');
      try {
        await DailyCleanupService.executeDailyCleanup();
      } catch (err: unknown) {
        console.error('[Cleanup] Scheduled job encountered unhandled error:', err);
      }
    },
    {
      timezone,
    }
  );

  return scheduledTask;
}

/**
 * Stops the scheduled daily cleanup task (useful for test teardown and graceful shutdown).
 */
export function stopDailyCleanupScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Cleanup] Daily cleanup scheduler stopped');
  }
}
