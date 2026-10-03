import fsSync from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { PdfLayout, type PaperSize, type Orientation } from './pdf-layout.js';
import { pdfStorage } from './pdf-storage.js';
import { imageStorage } from '../storage/local-image-storage.js';
import { BookService } from '../book.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface GeneratePdfInput {
  bookId: string;
  paperSize?: string;
  orientation?: string;
}

export interface GeneratedPdfResult {
  success: boolean;
  pdfUrl: string;
  pageCount: number;
  filePath: string;
}

export class PdfGeneratorService {
  private static inProgressPdfs: Set<string> = new Set();

  /**
   * Generates a printable PDF from a book's completed coloring pages
   */
  static async generateBookPdf(input: GeneratePdfInput): Promise<GeneratedPdfResult> {
    const { bookId } = input;

    // Prevent concurrent duplicate generation for the same book
    if (this.inProgressPdfs.has(bookId)) {
      throw new AppError('PDF generation is already in progress for this book.', 409, 'PDF_GENERATION_IN_PROGRESS');
    }

    // 1. Load book
    const book = await BookService.getBookById(bookId);
    if (!book) {
      throw new AppError('Coloring book not found.', 404, 'NOT_FOUND');
    }

    // 2. Load active pages (excluding deleted) sorted strictly by pageNumber ASC
    const activePages = (book.pages || [])
      .filter((p) => p.status !== 'deleted')
      .sort((a, b) => a.pageNumber - b.pageNumber);

    if (activePages.length === 0) {
      throw new AppError('Your book has no pages. Generate a new page or return to creation.', 400, 'NO_PAGES');
    }

    // 3. Validate that every page has completed artwork
    for (const page of activePages) {
      if (page.status === 'failed' || !page.imageUrl) {
        throw new AppError(
          `Page ${page.pageNumber} is missing artwork. Please regenerate or remove it before creating the PDF.`,
          400,
          'PAGE_ARTWORK_MISSING'
        );
      }
      if (page.status === 'generating') {
        throw new AppError(
          `Page ${page.pageNumber} is still generating artwork. Please wait for generation to complete before creating the PDF.`,
          400,
          'PAGE_GENERATING'
        );
      }
    }

    // 4. Validate image files exist on disk
    const resolvedPages: Array<{ pageNumber: number; imagePath: string }> = [];
    for (const page of activePages) {
      const diskPath = this.resolveImagePath(bookId, page.pageNumber, page.imageUrl);
      if (!diskPath || !fsSync.existsSync(diskPath)) {
        throw new AppError(
          `Page ${page.pageNumber} is missing artwork. Please regenerate it before creating the PDF.`,
          400,
          'PAGE_ARTWORK_MISSING'
        );
      }
      resolvedPages.push({ pageNumber: page.pageNumber, imagePath: diskPath });
    }

    // 5. Parse Paper Size & Orientation
    const paperSize: PaperSize = PdfLayout.normalizePaperSize(input.paperSize || book.paperSize || 'A4');
    const orientation: Orientation = PdfLayout.normalizeOrientation(input.orientation || book.orientation || 'PORTRAIT');

    this.inProgressPdfs.add(bookId);

    try {
      await BookService.updateBookPdfInfo(bookId, {
        pdfStatus: 'generating',
        paperSize,
        orientation,
      });

      // Ensure storage directory
      await pdfStorage.ensureDirectory(bookId);
      const outputPath = pdfStorage.getPdfPath(bookId);

      // Create PDF Document
      await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({
          autoFirstPage: false,
          compress: false, // Ensures crisp vector lines & unblurred raster linework
          info: {
            Title: book.title || `${book.prompt} Coloring Book`,
            Author: 'ColorBook AI',
            Subject: 'Printable Coloring Book',
          },
        });

        const writeStream = fsSync.createWriteStream(outputPath);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err: Error) => reject(err));

        doc.pipe(writeStream);

        const layout = PdfLayout.getLayout(paperSize, orientation);

        for (const pageItem of resolvedPages) {
          doc.addPage({
            size: [layout.pageWidth, layout.pageHeight],
            margin: 0,
          });

          // 1. Pure white page background
          doc.rect(0, 0, layout.pageWidth, layout.pageHeight).fill('#FFFFFF');

          // 2. Clean, minimal printable border
          doc
            .rect(layout.borderRect.x, layout.borderRect.y, layout.borderRect.width, layout.borderRect.height)
            .lineWidth(1.5)
            .stroke('#000000');

          // 3. Inspect image dimensions and scale with 'contain'
          try {
            const imgObj = (doc as any).openImage(pageItem.imagePath);
            const fitting = PdfLayout.fitImage(layout, imgObj.width, imgObj.height);

            // 4. Draw centered coloring image
            doc.image(pageItem.imagePath, fitting.x, fitting.y, {
              width: fitting.width,
              height: fitting.height,
            });
          } catch (imgErr) {
            reject(new AppError(`Failed to render artwork for Page ${pageItem.pageNumber} into PDF: ${imgErr}`, 500, 'PDF_RENDER_FAILED'));
            return;
          }
        }

        doc.end();
      });

      const pdfUrl = pdfStorage.getPdfUrl(bookId);

      await BookService.updateBookPdfInfo(bookId, {
        pdfUrl,
        pdfStatus: 'completed',
        paperSize,
        orientation,
      });

      return {
        success: true,
        pdfUrl,
        pageCount: resolvedPages.length,
        filePath: outputPath,
      };
    } catch (err) {
      await BookService.updateBookPdfInfo(bookId, {
        pdfStatus: 'failed',
      });
      throw err;
    } finally {
      this.inProgressPdfs.delete(bookId);
    }
  }

  /**
   * Resolves the physical path on disk for a page image
   */
  private static resolveImagePath(bookId: string, pageNumber: number, imageUrl?: string | null): string | null {
    // 1. Check primary local storage path
    const primaryPath = imageStorage.getFilePath(bookId, pageNumber);
    if (fsSync.existsSync(primaryPath)) {
      return primaryPath;
    }

    // 2. Check if imageUrl points to a public illustration asset (e.g. mock or sample books)
    if (imageUrl) {
      // Remove cache buster query string
      const cleanUrl = imageUrl.split('?')[0];

      // If stored under /storage/images/books/...
      if (cleanUrl.startsWith('/storage/images/')) {
        const relPath = cleanUrl.replace(/^\/storage\/images\//, '');
        const candidate = path.join(imageStorage.getBaseDir(), relPath);
        if (fsSync.existsSync(candidate)) return candidate;
      }

      // If stored under /illustrations/...
      if (cleanUrl.startsWith('/illustrations/')) {
        const clientPublicCandidates = [
          path.resolve(process.cwd(), '../client/public', cleanUrl.replace(/^\//, '')),
          path.resolve(process.cwd(), 'client/public', cleanUrl.replace(/^\//, '')),
          path.resolve(process.cwd(), 'public', cleanUrl.replace(/^\//, '')),
        ];
        for (const cand of clientPublicCandidates) {
          if (fsSync.existsSync(cand)) {
            if (cand.toLowerCase().endsWith('.svg')) {
              // PDFKit only embeds raster images (PNG/JPEG). Provide safe PNG fallback from same directory.
              const pngVariant = cand.replace(/\.svg$/i, '.png');
              if (fsSync.existsSync(pngVariant)) return pngVariant;
              const fallbackRocket = path.join(path.dirname(cand), 'coloring-rocket.png');
              if (fsSync.existsSync(fallbackRocket)) return fallbackRocket;
            }
            return cand;
          }
        }
      }
    }

    return null;
  }
}
