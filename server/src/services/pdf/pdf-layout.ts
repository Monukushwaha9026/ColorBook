export type PaperSize = 'A4' | 'LETTER';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export interface PageDimensions {
  width: number;
  height: number;
}

export interface PageLayout {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  borderPadding: number;
  borderRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  printableArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageFittingResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Standard paper dimensions in points (72 points = 1 inch)
const DIMENSIONS: Record<PaperSize, PageDimensions> = {
  A4: {
    width: 595.28,  // 210mm
    height: 841.89, // 297mm
  },
  LETTER: {
    width: 612.0,   // 8.5 inches
    height: 792.0,  // 11 inches
  },
};

export class PdfLayout {
  /**
   * Normalizes paper size string (case-insensitive)
   */
  static normalizePaperSize(raw: string = 'A4'): PaperSize {
    const upper = raw.toUpperCase().trim();
    if (upper === 'LETTER' || upper === 'US LETTER' || upper === 'US_LETTER') {
      return 'LETTER';
    }
    return 'A4';
  }

  /**
   * Normalizes orientation string (case-insensitive)
   */
  static normalizeOrientation(raw: string = 'PORTRAIT'): Orientation {
    const upper = raw.toUpperCase().trim();
    if (upper === 'LANDSCAPE') {
      return 'LANDSCAPE';
    }
    return 'PORTRAIT';
  }

  /**
   * Computes the printable page layout, margin bounds, and border rectangle
   */
  static getLayout(paperSize: PaperSize = 'A4', orientation: Orientation = 'PORTRAIT'): PageLayout {
    const base = DIMENSIONS[paperSize] || DIMENSIONS.A4;
    const isLandscape = orientation === 'LANDSCAPE';

    const pageWidth = isLandscape ? Math.max(base.width, base.height) : Math.min(base.width, base.height);
    const pageHeight = isLandscape ? Math.min(base.width, base.height) : Math.max(base.width, base.height);

    // 36 pt (0.5 inch) printable margin from physical edge
    const margin = 36;
    // 10 pt padding between vector border and inner image
    const borderPadding = 10;

    const borderRect = {
      x: margin,
      y: margin,
      width: pageWidth - margin * 2,
      height: pageHeight - margin * 2,
    };

    const printableArea = {
      x: borderRect.x + borderPadding,
      y: borderRect.y + borderPadding,
      width: borderRect.width - borderPadding * 2,
      height: borderRect.height - borderPadding * 2,
    };

    return {
      pageWidth,
      pageHeight,
      margin,
      borderPadding,
      borderRect,
      printableArea,
    };
  }

  /**
   * Calculates 'contain' scaling to fit image within printable area without stretching or distortion
   */
  static fitImage(
    layout: PageLayout,
    imageWidth: number,
    imageHeight: number
  ): ImageFittingResult {
    const target = layout.printableArea;

    // Safety fallback
    const srcW = Math.max(1, imageWidth || 768);
    const srcH = Math.max(1, imageHeight || 1024);

    const scale = Math.min(target.width / srcW, target.height / srcH);
    const renderW = Math.round(srcW * scale);
    const renderH = Math.round(srcH * scale);

    // Center image within the printable area
    const renderX = Math.round(target.x + (target.width - renderW) / 2);
    const renderY = Math.round(target.y + (target.height - renderH) / 2);

    return {
      x: renderX,
      y: renderY,
      width: renderW,
      height: renderH,
    };
  }
}
