import zlib from 'zlib';
import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './image-provider.interface.js';

/**
 * TEST / DEVELOPMENT FALLBACK
 * 
 * Deterministic synthetic line-art generator strictly intended for:
 * - Automated test suites
 * - Continuous Integration (CI)
 * - Provider-unavailable architecture testing
 * 
 * This must NOT be presented in the UI as real AI image generation.
 */
export class TestImageProvider implements ImageProvider {
  readonly name = 'test';

  async generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
    const seed = input.variationSeed || Math.floor(Math.random() * 1000000);
    const buffer = this.generateFallbackColoringArt(input, seed);
    return {
      buffer,
      mimeType: 'image/png',
      width: 768,
      height: 1024,
    };
  }

  /**
   * Generates a valid, high-resolution black & white coloring page PNG for zero-dependency development
   */
  private generateFallbackColoringArt(input: ImageGenerationInput, seed: number): Buffer {
    const width = 768;
    const height = 1024;
    return this.createColoringBookPng(width, height, seed);
  }

  private createColoringBookPng(width: number, height: number, _seed: number): Buffer {
    const rowSize = 1 + width * 3;
    const rawData = Buffer.alloc(rowSize * height, 255); // Fill with white (255, 255, 255)

    const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const idx = y * rowSize + 1 + x * 3;
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
    };

    const drawLine = (x0: number, y0: number, x1: number, y1: number, thickness = 4) => {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      let x = x0;
      let y = y0;

      while (true) {
        for (let tx = -thickness; tx <= thickness; tx++) {
          for (let ty = -thickness; ty <= thickness; ty++) {
            if (tx * tx + ty * ty <= thickness * thickness) {
              setPixel(x + tx, y + ty, 0, 0, 0);
            }
          }
        }
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    };

    const drawCircle = (cx: number, cy: number, r: number, thickness = 5) => {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.005) {
        const x = Math.round(cx + Math.cos(angle) * r);
        const y = Math.round(cy + Math.sin(angle) * r);
        for (let tx = -thickness; tx <= thickness; tx++) {
          for (let ty = -thickness; ty <= thickness; ty++) {
            setPixel(x + tx, y + ty, 0, 0, 0);
          }
        }
      }
    };

    // Draw Outer Margin Border
    const margin = 40;
    drawLine(margin, margin, width - margin, margin, 3);
    drawLine(width - margin, margin, width - margin, height - margin, 3);
    drawLine(width - margin, height - margin, margin, height - margin, 3);
    drawLine(margin, height - margin, margin, margin, 3);

    // Draw Main Coloring Character / Scene Shape
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2) - 40;
    const radius = 180;

    drawCircle(centerX, centerY, radius, 5);
    drawCircle(centerX, centerY + 40, 100, 4);

    // Friendly Eyes
    drawCircle(centerX - 60, centerY - 40, 20, 4);
    drawCircle(centerX + 60, centerY - 40, 20, 4);

    // Pupils
    for (let px = -8; px <= 8; px++) {
      for (let py = -8; py <= 8; py++) {
        if (px * px + py * py <= 64) {
          setPixel(centerX - 60 + px, centerY - 40 + py, 0, 0, 0);
          setPixel(centerX + 60 + px, centerY - 40 + py, 0, 0, 0);
        }
      }
    }

    // Joyful Smile
    for (let a = 0.2; a < Math.PI - 0.2; a += 0.01) {
      const sx = Math.round(centerX + Math.cos(a) * 70);
      const sy = Math.round(centerY + 30 + Math.sin(a) * 50);
      setPixel(sx, sy, 0, 0, 0);
      setPixel(sx, sy + 1, 0, 0, 0);
      setPixel(sx, sy - 1, 0, 0, 0);
    }

    // Landscape hills / clouds
    drawLine(margin, height - 220, centerX, height - 260, 4);
    drawLine(centerX, height - 260, width - margin, height - 220, 4);
    drawLine(margin, height - 160, width - margin, height - 160, 4);

    // Star decorations
    drawCircle(margin + 80, margin + 120, 30, 3);
    drawCircle(width - margin - 80, margin + 120, 30, 3);

    // Deflate raw scanlines
    const compressed = zlib.deflateSync(rawData);

    // Calculate CRC32
    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
    const crc32 = (buf: Buffer) => {
      let c = 0xffffffff;
      for (let i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
      }
      return (c ^ 0xffffffff) >>> 0;
    };

    const makeChunk = (type: string, data: Buffer) => {
      const typeBuf = Buffer.from(type, 'ascii');
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(data.length, 0);

      const typeAndData = Buffer.concat([typeBuf, data]);
      const crc = crc32(typeAndData);
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE(crc, 0);

      return Buffer.concat([lenBuf, typeAndData, crcBuf]);
    };

    // PNG Signature
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // Bit depth: 8
    ihdrData[9] = 2; // Color type: 2 (RGB)
    ihdrData[10] = 0; // Compression
    ihdrData[11] = 0; // Filter
    ihdrData[12] = 0; // Interlace
    const ihdrChunk = makeChunk('IHDR', ihdrData);

    // IDAT
    const idatChunk = makeChunk('IDAT', compressed);

    // IEND
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  }
}
