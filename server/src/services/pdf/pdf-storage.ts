import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { AppError } from '../../middleware/errorHandler.js';

export class PdfStorage {
  private baseDir: string;

  constructor() {
    const configuredPath = process.env.LOCAL_PDF_STORAGE_PATH || './storage/pdfs';
    this.baseDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  /**
   * Sanitizes book identifier and protects against directory traversal
   */
  private sanitizeId(id: string): string {
    const clean = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!clean) {
      throw new AppError('Invalid book identifier.', 400, 'INVALID_IDENTIFIER');
    }
    return clean;
  }

  /**
   * Verifies that the resolved path is strictly within the allowed root directory
   */
  private assertSafePath(targetPath: string): void {
    const relative = path.relative(this.baseDir, targetPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AppError('Path traversal attempt detected.', 400, 'INVALID_PATH');
    }
  }

  getBookPdfDirectory(bookId: string): string {
    const safeId = this.sanitizeId(bookId);
    const bookDir = path.join(this.baseDir, 'books', safeId);
    this.assertSafePath(bookDir);
    return bookDir;
  }

  getPdfPath(bookId: string): string {
    const filePath = path.join(this.getBookPdfDirectory(bookId), 'coloring-book.pdf');
    this.assertSafePath(filePath);
    return filePath;
  }

  getPdfUrl(bookId: string): string {
    const safeId = this.sanitizeId(bookId);
    return `/storage/pdfs/books/${safeId}/coloring-book.pdf?t=${Date.now()}`;
  }

  async ensureDirectory(bookId: string): Promise<string> {
    const dir = this.getBookPdfDirectory(bookId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  pdfExists(bookId: string): boolean {
    try {
      const filePath = this.getPdfPath(bookId);
      return fsSync.existsSync(filePath);
    } catch {
      return false;
    }
  }

  async deletePdf(bookId: string): Promise<boolean> {
    try {
      const dir = this.getBookPdfDirectory(bookId);
      await fs.rm(dir, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }
}

export const pdfStorage = new PdfStorage();
