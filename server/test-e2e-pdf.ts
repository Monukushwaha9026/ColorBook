import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { TestImageProvider } from './src/services/image/test-image-provider.js';
import { imageStorage } from './src/services/storage/local-image-storage.js';
import { pdfStorage } from './src/services/pdf/pdf-storage.js';

function inspectPdfBuffer(buffer: Buffer) {
  const content = buffer.toString('latin1');
  const countMatch = content.match(/\/Count\s+(\d+)/);
  const pageMatches = content.match(/\/Type\s*\/Page\b(?!\s*s)/g);
  return {
    pageCount: countMatch ? parseInt(countMatch[1], 10) : (pageMatches ? pageMatches.length : 0),
    size: buffer.length,
  };
}

async function runEndToEndTest() {
  console.log('\n======================================================');
  console.log('  COLORBOOK AI — STEP 2: END-TO-END FLOW VERIFICATION');
  console.log('======================================================\n');

  // Step 1: User creates book with 4 pages
  console.log('1. User enters idea and creates 4-page book...');
  const createRes = await fetch('http://localhost:5000/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Enchanted Castle and Dragon Friends',
      ageGroup: 'children',
      pageCount: 4,
    }),
  });
  if (!createRes.ok) throw new Error(`Create book failed with status ${createRes.status}`);
  const { book } = (await createRes.json()) as any;
  const bookId = book.id;
  console.log(`   ✓ Book created: ${bookId} ("${book.title || 'Enchanted Castle'}")`);

  // Step 2: Book planned and 4 pages generated
  console.log('2. Generating artwork for all 4 pages...');
  const provider = new TestImageProvider();
  const pagesData = [];
  for (let i = 1; i <= 4; i++) {
    const gen = await provider.generateImage({
      bookId,
      pageNumber: i,
      theme: 'Castle and dragons',
      concept: `Dragon adventure page ${i}`,
      ageGroup: 'children',
    });
    const url = await imageStorage.saveImage(gen.buffer, bookId, i);
    pagesData.push({
      pageNumber: i,
      concept: `Dragon adventure page ${i}`,
      imageUrl: url,
      status: 'completed',
    });
  }

  await fetch(`http://localhost:5000/api/books/${bookId}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages: pagesData }),
  });
  console.log('   ✓ 4 pages saved and completed');

  // Step 3: Regenerate page 2
  console.log('3. User regenerates Page 2 with new variation...');
  const regenImg = await provider.generateImage({
    bookId,
    pageNumber: 2,
    theme: 'Castle and dragons',
    concept: 'Baby dragon holding magical shield (variation)',
    ageGroup: 'children',
  });
  const regenUrl = await imageStorage.saveImage(regenImg.buffer, bookId, 2);
  pagesData[1].concept = 'Baby dragon holding magical shield (variation)';
  pagesData[1].imageUrl = regenUrl;
  await fetch(`http://localhost:5000/api/books/${bookId}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages: pagesData }),
  });
  console.log('   ✓ Page 2 regenerated successfully');

  // Step 4: Delete page 4
  console.log('4. User deletes Page 4...');
  const delRes = await fetch(`http://localhost:5000/api/books/${bookId}/pages/4`, {
    method: 'DELETE',
  });
  if (!delRes.ok) throw new Error(`Delete page failed with status ${delRes.status}`);
  const delData = (await delRes.json()) as any;
  console.log(`   ✓ Page 4 deleted. Remaining pages: ${delData.remainingPages.length}`);

  // Step 5 & 6: Choose A4 Portrait and generate PDF
  console.log('5. Choosing A4 Portrait and triggering PDF generation...');
  const genPdfRes = await fetch(`http://localhost:5000/api/books/${bookId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paperSize: 'A4',
      orientation: 'PORTRAIT',
    }),
  });
  if (!genPdfRes.ok) throw new Error(`Generate PDF failed with status ${genPdfRes.status}`);
  const genPdfData = (await genPdfRes.json()) as any;
  console.log(`   ✓ PDF generation complete: ${genPdfData.pdfUrl}`);

  // Step 7: Download and verify PDF
  console.log('6. Downloading PDF and inspecting printable artifact...');
  const dlRes = await fetch(`http://localhost:5000/api/books/${bookId}/pdf`);
  if (!dlRes.ok) throw new Error(`Download PDF failed with status ${dlRes.status}`);
  const pdfBytes = Buffer.from(await dlRes.arrayBuffer());
  const inspected = inspectPdfBuffer(pdfBytes);
  console.log(`   ✓ PDF size: ${inspected.size} bytes`);
  console.log(`   ✓ Verified Page Count: ${inspected.pageCount}`);

  if (inspected.pageCount !== 3) {
    throw new Error(`Expected exactly 3 pages in final PDF, but got ${inspected.pageCount}!`);
  }

  // Clean up test book
  await imageStorage.deleteBookImages(bookId);
  await pdfStorage.deletePdf(bookId);

  console.log('\n======================================================');
  console.log('  END-TO-END FLOW VERIFICATION COMPLETED SUCCESSFULLY! ✓');
  console.log('======================================================\n');
}

runEndToEndTest().catch((err) => {
  console.error('\n❌ E2E FLOW FAILED:', err);
  process.exit(1);
});
