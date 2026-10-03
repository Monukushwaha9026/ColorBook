import fs from 'fs/promises';
import path from 'path';
import type { ImageStorage } from './image-storage.interface.js';
import { AppError } from '../../middleware/errorHandler.js';

export class LocalImageStorage implements ImageStorage {
  private baseDir: string;
  private referencesDir: string;

  constructor() {
    const configuredPath = process.env.LOCAL_IMAGE_STORAGE_PATH || './storage/images';
    this.baseDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);

    this.referencesDir = path.resolve(this.baseDir, '../references');
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  getReferencesDir(): string {
    return this.referencesDir;
  }

  /**
   * Sanitizes book identifiers and prevents directory traversal attacks
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
  private assertSafePath(targetPath: string, allowedRoot: string): void {
    const relative = path.relative(allowedRoot, targetPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AppError('Path traversal attempt detected.', 400, 'INVALID_PATH');
    }
  }

  private getBookDirectory(bookId: string): string {
    const safeId = this.sanitizeId(bookId);
    const bookDir = path.join(this.baseDir, 'books', safeId);
    this.assertSafePath(bookDir, this.baseDir);
    return bookDir;
  }

  getFilePath(bookId: string, pageNumber: number): string {
    const safePageNum = Math.max(1, Math.floor(Number(pageNumber) || 1));
    const filePath = path.join(this.getBookDirectory(bookId), `page-${safePageNum}.png`);
    this.assertSafePath(filePath, this.baseDir);
    return filePath;
  }

  async saveImage(buffer: Buffer, bookId: string, pageNumber: number): Promise<string> {
    const bookDir = this.getBookDirectory(bookId);
    await fs.mkdir(bookDir, { recursive: true });

    const filePath = this.getFilePath(bookId, pageNumber);
    await fs.writeFile(filePath, buffer);

    return this.getImageUrl(bookId, pageNumber);
  }

  getImageUrl(bookId: string, pageNumber: number): string {
    const safeId = this.sanitizeId(bookId);
    const safePageNum = Math.max(1, Math.floor(Number(pageNumber) || 1));
    return `/storage/images/books/${safeId}/page-${safePageNum}.png?t=${Date.now()}`;
  }

  async deletePageImage(bookId: string, pageNumber: number): Promise<void> {
    try {
      const filePath = this.getFilePath(bookId, pageNumber);
      await fs.unlink(filePath);
    } catch {
      // Ignored if file does not exist
    }
  }

  async deleteBookImages(bookId: string): Promise<void> {
    try {
      const bookDir = this.getBookDirectory(bookId);
      await fs.rm(bookDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  }

  /**
   * Saves a base64 user reference image to disk and returns its safe public URL
   */
  async saveReferenceImage(bookId: string, dataUrl: string): Promise<string> {
    const safeId = this.sanitizeId(bookId);
    await fs.mkdir(this.referencesDir, { recursive: true });

    const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) {
      throw new AppError('Invalid reference image data format.', 400, 'INVALID_IMAGE_DATA');
    }

    const mime = match[1].toLowerCase();
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      throw new AppError('Reference image exceeds the allowed 5MB size limit.', 400, 'FILE_TOO_LARGE');
    }

    const filename = `${safeId}.${ext}`;
    const filePath = path.join(this.referencesDir, filename);
    this.assertSafePath(filePath, this.referencesDir);

    await fs.writeFile(filePath, buffer);
    return `/storage/references/${filename}?t=${Date.now()}`;
  }

  /**
   * Deletes a stored reference image when a book is deleted
   */
  async deleteReferenceImage(bookId: string): Promise<void> {
    const safeId = this.sanitizeId(bookId);
    const extensions = ['png', 'jpg', 'jpeg', 'webp'];
    for (const ext of extensions) {
      try {
        const filePath = path.join(this.referencesDir, `${safeId}.${ext}`);
        await fs.unlink(filePath);
      } catch {
        // Ignored
      }
    }
  }
}

export const imageStorage = new LocalImageStorage();
