import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

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

  getBookPdfDirectory(bookId: string): string {
    return path.join(this.baseDir, 'books', bookId);
  }

  getPdfPath(bookId: string): string {
    return path.join(this.getBookPdfDirectory(bookId), 'coloring-book.pdf');
  }

  getPdfUrl(bookId: string): string {
    return `/storage/pdfs/books/${bookId}/coloring-book.pdf?t=${Date.now()}`;
  }

  async ensureDirectory(bookId: string): Promise<string> {
    const dir = this.getBookPdfDirectory(bookId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  pdfExists(bookId: string): boolean {
    const filePath = this.getPdfPath(bookId);
    return fsSync.existsSync(filePath);
  }

  async deletePdf(bookId: string): Promise<boolean> {
    const filePath = this.getPdfPath(bookId);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const pdfStorage = new PdfStorage();
