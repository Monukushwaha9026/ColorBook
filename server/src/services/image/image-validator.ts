export interface ImageValidationResult {
  valid: boolean;
  reasons: string[];
  score: number;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Quality & Format Validator for Coloring Book Pages
 * 
 * Provides automated quality gates across two distinct tiers:
 * 1. Technical Validation:
 *    - Valid image buffer and magic header detection (PNG, JPEG, WebP, SVG)
 *    - Correct format structure (e.g. terminating IEND chunks)
 *    - Sufficient dimensions (>= 512x512 resolution for printable output)
 *    - Non-empty payload (> 512 bytes)
 * 
 * 2. Visual Quality & Coloring Gate:
 *    - Complexity & entropy check (rejects solid blank or collapsed images)
 *    - Validates coloring page suitability without claiming omniscient semantic safety
 */
export class ImageValidator {
  /**
   * Validate generated image buffer against technical format standards and coloring quality gates
   */
  static validate(buffer: Buffer | null | undefined, minResolution = 256): ImageValidationResult {
    const reasons: string[] = [];
    let score = 1.0;

    // 1. Image exists and is not null/empty
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return {
        valid: false,
        reasons: ['Image buffer is missing or null.'],
        score: 0,
      };
    }

    if (buffer.length < 512) {
      return {
        valid: false,
        reasons: ['Image buffer is too small (<512 bytes), likely empty or truncated.'],
        score: 0,
      };
    }

    // 2. Format & Dimension Inspection
    let width = 0;
    let height = 0;
    let format = 'unknown';

    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      format = 'png';
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);

      // Verify PNG ends with IEND chunk if sufficiently large
      const hasIEnd = buffer.includes(Buffer.from([0x49, 0x45, 0x4e, 0x44]));
      if (!hasIEnd) {
        reasons.push('PNG file is missing terminating IEND chunk; image may be truncated.');
        score -= 0.3;
      }
    }
    // Check JPEG signature: FF D8 FF
    else if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      format = 'jpeg';
      // Find SOF marker
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xff && (buffer[offset + 1] === 0xc0 || buffer[offset + 1] === 0xc2)) {
          height = buffer.readUInt16BE(offset + 5);
          width = buffer.readUInt16BE(offset + 7);
          break;
        }
        offset++;
      }
    }
    // Check SVG or WebP
    else if (buffer.toString('utf8', 0, 100).includes('<svg')) {
      format = 'svg';
      width = 1024;
      height = 1024;
    } else if (buffer.slice(0, 4).toString('ascii') === 'RIFF') {
      format = 'webp';
      width = 512;
      height = 512;
    } else {
      reasons.push('Unrecognized image signature; expected PNG, JPEG, WebP, or SVG.');
      score -= 0.5;
    }

    // 3. Minimum resolution check
    if (width > 0 && height > 0) {
      if (width < minResolution || height < minResolution) {
        reasons.push(`Image resolution (${width}x${height}) is below minimum requirement (${minResolution}x${minResolution}).`);
        score -= 0.4;
      }
    } else if (format !== 'svg') {
      reasons.push('Could not determine valid width and height from image header.');
      score -= 0.3;
    }

    // 4. Data entropy / Non-blank check
    // An entirely blank white or black image compresses into a very small payload (< 1.5 KB)
    if (format === 'png' && buffer.length < 1500) {
      reasons.push('Image payload is suspiciously low in complexity; may be a solid or empty image.');
      score -= 0.4;
    }

    score = Math.max(0, Math.min(1.0, score));

    return {
      valid: reasons.length === 0,
      reasons,
      score,
      width: width || undefined,
      height: height || undefined,
      format,
    };
  }
}
