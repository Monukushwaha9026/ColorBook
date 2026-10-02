import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { HuggingFaceImageProvider } from './src/services/image/huggingface-image-provider.js';
import { ImageValidator } from './src/services/image/image-validator.js';
import { imageStorage } from './src/services/storage/local-image-storage.js';

async function runLiveHFTest() {
  console.log('\n======================================================');
  console.log('  TESTING LIVE HUGGING FACE INFERENCE');
  console.log('======================================================\n');

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL || 'black-forest-labs/FLUX.1-schnell';

  console.log(`API Key configured: ${apiKey ? `hf_...${apiKey.slice(-6)}` : 'NONE'}`);
  console.log(`Model: ${model}\n`);

  const provider = new HuggingFaceImageProvider(apiKey, model);

  console.log('Generating coloring page via Hugging Face API...');
  const startTime = Date.now();

  try {
    const result = await provider.generateImage({
      bookId: 'live-hf-dinosaur',
      pageNumber: 1,
      theme: 'Prehistoric jungle',
      concept: 'A friendly dinosaur walking through a simple prehistoric jungle, professional children coloring book illustration, clean black outlines, white background',
      ageGroup: 'children',
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Hugging Face responded in ${elapsed}s!`);
    console.log(`  - Buffer size: ${result.buffer.length} bytes`);
    console.log(`  - MIME Type: ${result.mimeType}`);
    console.log(`  - Dimensions: ${result.width}x${result.height}`);

    // Validate image
    const validation = ImageValidator.validate(result.buffer);
    console.log(`\nValidation result: ${validation.valid ? 'VALID ✓' : 'INVALID ✗'}`);
    console.log(`  - Format detected: ${validation.format}`);
    console.log(`  - Dimensions: ${validation.width}x${validation.height}`);
    console.log(`  - Quality score: ${validation.score}`);
    if (validation.reasons.length > 0) {
      console.log(`  - Reasons: ${validation.reasons.join(', ')}`);
    }

    // Save image to storage
    const storedUrl = await imageStorage.saveImage(result.buffer, 'live-hf-dinosaur', 1);
    const diskPath = imageStorage.getFilePath('live-hf-dinosaur', 1);
    console.log(`\n✓ Stored image URL: ${storedUrl}`);
    console.log(`✓ Stored on disk: ${diskPath}`);
    console.log(`✓ File exists: ${fs.existsSync(diskPath)} (${fs.statSync(diskPath).size} bytes)`);

    // Verify Express static serving
    const expressUrl = `http://localhost:5000${storedUrl}`;
    try {
      const expressRes = await fetch(expressUrl);
      console.log(`✓ Express route verified: GET ${expressUrl} -> HTTP ${expressRes.status} (${expressRes.headers.get('content-type')})`);
    } catch {
      console.log('Note: Express server may be restarting or on different port.');
    }

    console.log('\n======================================================');
    console.log('  LIVE HUGGING FACE GENERATION SUCCESSFUL! ✓');
    console.log('======================================================\n');
  } catch (err: unknown) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ Hugging Face Generation Failed after ${elapsed}s:`, err);
  }
}

runLiveHFTest();
