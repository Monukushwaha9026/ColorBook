import type { AgeGroup } from '../../types/index.js';

export interface ImageGenerationInput {
  bookId: string;
  pageNumber: number;
  bookTitle?: string;
  theme: string;
  concept: string;
  ageGroup: AgeGroup;
  difficulty?: string;
  visualPrompt?: string;
  isRegeneration?: boolean;
  variationSeed?: number;
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ImageProvider {
  readonly name: string;
  generateImage(input: ImageGenerationInput): Promise<GeneratedImage>;
}
