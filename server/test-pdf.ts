import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PdfLayout, PDF_LAYOUTS, type PaperSize, type Orientation } from './src/services/pdf/pdf-layout.js';
import { PdfGeneratorService } from './src/services/pdf/pdf-generator.service.js';
import { pdfStorage } from './src/services/pdf/pdf-storage.js';
import { imageStorage } from './src/services/storage/local-image-storage.js';
import { BookService } from './src/services/book.service.js';
import { TestImageProvider } from './src/services/image/test-image-provider.js';
import { AppError } from './src/middleware/errorHandler.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

/**
 * Parses page count and MediaBox bounding boxes from raw PDF byte buffer
 */
function inspectPdfBuffer(buffer: Buffer): { pageCount: number; widths: number[]; heights: number[] } {
  const content = buffer.toString('latin1');

  // Count /Type /Page (excluding /Type /Pages)
  const pageMatches = content.match(/\/Type\s*\/Page\b(?!\s*s)/g);
  const countMatch = content.match(/\/Count\s+(\d+)/);
  const pageCount = countMatch ? parseInt(countMatch[1], 10) : (pageMatches ? pageMatches.length : 0);

  // Extract MediaBox values
  const widths: number[] = [];
  const heights: number[] = [];
  const mediaBoxRegex = /\/MediaBox\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/g;
  let match: RegExpExecArray | null;
  while ((match = mediaBoxRegex.exec(content)) !== null) {
    const x1 = parseFloat(match[1]);
    const y1 = parseFloat(match[2]);
    const x2 = parseFloat(match[3]);
    const y2 = parseFloat(match[4]);
    widths.push(Math.round(Math.abs(x2 - x1) * 100) / 100);
    heights.push(Math.round(Math.abs(y2 - y1) * 100) / 100);
  }

  return { pageCount, widths, heights };
}

/**
 * Helper to generate valid synthetic line-art PNG images for a book
 */
async function populateBookWithImages(bookId: string, count: number) {
  const provider = new TestImageProvider();
  for (let i = 1; i <= count; i++) {
    const gen = await provider.generateImage({
      bookId,
      pageNumber: i,
      theme: 'Testing Theme',
      concept: `Coloring page ${i}`,
      ageGroup: 'children',
    });
    const storedUrl = await imageStorage.saveImage(gen.buffer, bookId, i);
    await BookService.updatePage(bookId, i, { imageUrl: storedUrl, status: 'completed' });
  }
}

async function runPdfTests() {
  console.log('\n======================================================');
  console.log('  COLORBOOK AI — STEP 2: PDF GENERATION TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // UNIT TESTS: Layout & Geometry Calculations
  // ---------------------------------------------------------------------------
  console.log('[Layout] Testing PDF Dimensions, Contain Scaling & Border Margins...');
  {
    const a4p = PdfLayout.getLayout('A4', 'PORTRAIT');
    assert(Math.abs(a4p.pageWidth - 595.28) < 0.1 && Math.abs(a4p.pageHeight - 841.89) < 0.1, 'A4 Portrait dimensions: 595.28 x 841.89 pt');

    const a4l = PdfLayout.getLayout('A4', 'LANDSCAPE');
    assert(Math.abs(a4l.pageWidth - 841.89) < 0.1 && Math.abs(a4l.pageHeight - 595.28) < 0.1, 'A4 Landscape dimensions: 841.89 x 595.28 pt');

    const letterP = PdfLayout.getLayout('LETTER', 'PORTRAIT');
    assert(letterP.pageWidth === 612 && letterP.pageHeight === 792, 'US Letter Portrait dimensions: 612 x 792 pt');

    const letterL = PdfLayout.getLayout('LETTER', 'LANDSCAPE');
    assert(letterL.pageWidth === 792 && letterL.pageHeight === 612, 'US Letter Landscape dimensions: 792 x 612 pt');

    // Test fitImage contain scaling
    const fittedSquare = PdfLayout.fitImage(a4p, 1024, 1024);
    assert(fittedSquare.width === fittedSquare.height, 'Square image preserves 1:1 aspect ratio when scaled');
    assert(fittedSquare.width <= a4p.printableArea.width && fittedSquare.height <= a4p.printableArea.height, 'Fitted image fits within printable drawable area');
    assert(fittedSquare.x >= a4p.margin && (fittedSquare.x + fittedSquare.width) <= (a4p.pageWidth - a4p.margin), 'Fitted image respects printable margins (36pt / 0.5in)');

    const fittedWide = PdfLayout.fitImage(a4p, 2000, 1000); // 2:1 aspect ratio
    assert(Math.abs((fittedWide.width / fittedWide.height) - 2.0) < 0.01, 'Wide image maintains 2:1 aspect ratio without stretching');
  }

  // ---------------------------------------------------------------------------
  // TEST 1: 3-Page Book -> Exactly 3-Page PDF
  // ---------------------------------------------------------------------------
  console.log('\n[Test 1/13] 3-page book -> Exactly 3-page PDF...');
  const book3 = await BookService.createBook({
    prompt: 'Playful puppies in the park',
    ageGroup: 'children',
    pageCount: 3,
    paperSize: 'A4',
    orientation: 'PORTRAIT',
  });
  await BookService.planBook(book3.id);
  await populateBookWithImages(book3.id, 3);

  const res3 = await PdfGeneratorService.generateBookPdf({
    bookId: book3.id,
    paperSize: 'A4',
    orientation: 'PORTRAIT',
  });

  assert(res3.success === true, 'PDF generation succeeded for 3-page book');
  assert(fs.existsSync(res3.filePath), `PDF file exists on disk at ${res3.filePath}`);
  const pdf3Buffer = fs.readFileSync(res3.filePath);
  assert(pdf3Buffer.length > 5000, `PDF buffer is valid and non-empty (${pdf3Buffer.length} bytes)`);
  const info3 = inspectPdfBuffer(pdf3Buffer);
  assert(info3.pageCount === 3, `PDF contains exactly 3 pages (found ${info3.pageCount})`);

  // ---------------------------------------------------------------------------
  // TEST 2: 8-Page Book -> Exactly 8-Page PDF
  // ---------------------------------------------------------------------------
  console.log('\n[Test 2/13] 8-page book -> Exactly 8-page PDF...');
  const book8 = await BookService.createBook({
    prompt: 'Deep sea marine animals',
    ageGroup: 'kids',
    pageCount: 8,
    paperSize: 'LETTER',
    orientation: 'PORTRAIT',
  });
  await BookService.planBook(book8.id);
  await populateBookWithImages(book8.id, 8);

  const res8 = await PdfGeneratorService.generateBookPdf({
    bookId: book8.id,
    paperSize: 'LETTER',
    orientation: 'PORTRAIT',
  });
  assert(res8.success === true, 'PDF generation succeeded for 8-page book');
  const pdf8Buffer = fs.readFileSync(res8.filePath);
  const info8 = inspectPdfBuffer(pdf8Buffer);
  assert(info8.pageCount === 8, `PDF contains exactly 8 pages (found ${info8.pageCount})`);

  // ---------------------------------------------------------------------------
  // TEST 3: A4 Portrait Dimension Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Test 3/13] A4 Portrait dimension verification...');
  const resA4P = await PdfGeneratorService.generateBookPdf({
    bookId: book3.id,
    paperSize: 'A4',
    orientation: 'PORTRAIT',
  });
  const pdfA4PBuffer = fs.readFileSync(resA4P.filePath);
  const infoA4P = inspectPdfBuffer(pdfA4PBuffer);
  assert(infoA4P.widths.some((w) => Math.abs(w - 595.28) < 1), `A4 Portrait width matches 595.28 pt (${infoA4P.widths[0]})`);
  assert(infoA4P.heights.some((h) => Math.abs(h - 841.89) < 1), `A4 Portrait height matches 841.89 pt (${infoA4P.heights[0]})`);

  // ---------------------------------------------------------------------------
  // TEST 4: A4 Landscape Dimension Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Test 4/13] A4 Landscape dimension verification...');
  const resA4L = await PdfGeneratorService.generateBookPdf({
    bookId: book3.id,
    paperSize: 'A4',
    orientation: 'LANDSCAPE',
  });
  const pdfA4LBuffer = fs.readFileSync(resA4L.filePath);
  const infoA4L = inspectPdfBuffer(pdfA4LBuffer);
  assert(infoA4L.widths.some((w) => Math.abs(w - 841.89) < 1), `A4 Landscape width matches 841.89 pt (${infoA4L.widths[0]})`);
  assert(infoA4L.heights.some((h) => Math.abs(h - 595.28) < 1), `A4 Landscape height matches 595.28 pt (${infoA4L.heights[0]})`);

  // ---------------------------------------------------------------------------
  // TEST 5: US Letter Portrait Dimension Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Test 5/13] US Letter Portrait dimension verification...');
  const resLetterP = await PdfGeneratorService.generateBookPdf({
    bookId: book3.id,
    paperSize: 'LETTER',
    orientation: 'PORTRAIT',
  });
  const pdfLetterPBuffer = fs.readFileSync(resLetterP.filePath);
  const infoLetterP = inspectPdfBuffer(pdfLetterPBuffer);
  assert(infoLetterP.widths.some((w) => Math.abs(w - 612) < 1), `Letter Portrait width matches 612 pt (${infoLetterP.widths[0]})`);
  assert(infoLetterP.heights.some((h) => Math.abs(h - 792) < 1), `Letter Portrait height matches 792 pt (${infoLetterP.heights[0]})`);

  // ---------------------------------------------------------------------------
  // TEST 6: US Letter Landscape Dimension Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Test 6/13] US Letter Landscape dimension verification...');
  const resLetterL = await PdfGeneratorService.generateBookPdf({
    bookId: book3.id,
    paperSize: 'LETTER',
    orientation: 'LANDSCAPE',
  });
  const pdfLetterLBuffer = fs.readFileSync(resLetterL.filePath);
  const infoLetterL = inspectPdfBuffer(pdfLetterLBuffer);
  assert(infoLetterL.widths.some((w) => Math.abs(w - 792) < 1), `Letter Landscape width matches 792 pt (${infoLetterL.widths[0]})`);
  assert(infoLetterL.heights.some((h) => Math.abs(h - 612) < 1), `Letter Landscape height matches 612 pt (${infoLetterL.heights[0]})`);

  // ---------------------------------------------------------------------------
  // TEST 7: Delete One Page -> Excluded from PDF
  // ---------------------------------------------------------------------------
  console.log('\n[Test 7/13] Delete one page -> Deleted page excluded from PDF...');
  // Delete page 2 of book3 (which had 3 pages)
  const delRes = await BookService.deletePage(book3.id, 2);
  assert(delRes.remainingPages.length === 2, 'Remaining pages reduced from 3 to 2');
  assert(delRes.remainingPages[0].pageNumber === 1 && delRes.remainingPages[1].pageNumber === 2, 'Pages renumbered cleanly to 1 and 2');

  const resDel = await PdfGeneratorService.generateBookPdf({
    bookId: book3.id,
    paperSize: 'A4',
    orientation: 'PORTRAIT',
  });
  const pdfDelBuffer = fs.readFileSync(resDel.filePath);
  const infoDel = inspectPdfBuffer(pdfDelBuffer);
  assert(infoDel.pageCount === 2, `PDF after deletion contains exactly 2 pages (found ${infoDel.pageCount})`);

  // ---------------------------------------------------------------------------
  // TEST 8: Failed Page Exists -> PDF Generation Blocked with 400
  // ---------------------------------------------------------------------------
  console.log('\n[Test 8/13] Failed page exists -> PDF generation blocked with 400...');
  const bookWithFail = await BookService.createBook({
    prompt: 'Space rockets',
    ageGroup: 'kids',
    pageCount: 3,
  });
  await BookService.planBook(bookWithFail.id);
  // Complete page 1 and page 2, leave page 3 failed
  await populateBookWithImages(bookWithFail.id, 2);
  await BookService.updatePage(bookWithFail.id, 3, { status: 'failed', failureReason: 'Generation timed out' });

  let failedError: AppError | null = null;
  try {
    await PdfGeneratorService.generateBookPdf({ bookId: bookWithFail.id });
  } catch (err) {
    failedError = err as AppError;
  }
  assert(failedError !== null, 'PDF generation blocked when a page has failed status');
  assert(failedError?.statusCode === 400, `Error HTTP status is 400 (got ${failedError?.statusCode})`);
  assert(failedError?.code === 'PAGE_ARTWORK_MISSING', `Error code is PAGE_ARTWORK_MISSING (got ${failedError?.code})`);
  assert(failedError?.message.includes('Page 3 is missing artwork'), `Error message mentions page 3: "${failedError?.message}"`);

  // ---------------------------------------------------------------------------
  // TEST 9: Regenerate Failed Page -> PDF Generation Succeeds
  // ---------------------------------------------------------------------------
  console.log('\n[Test 9/13] Regenerate failed page -> PDF generation succeeds...');
  // Provide valid artwork for page 3
  const provider = new TestImageProvider();
  const gen3 = await provider.generateImage({
    bookId: bookWithFail.id,
    pageNumber: 3,
    theme: 'Space rockets',
    concept: 'Rocket launching into orbit',
    ageGroup: 'kids',
  });
  const page3Url = await imageStorage.saveImage(gen3.buffer, bookWithFail.id, 3);
  await BookService.updatePage(bookWithFail.id, 3, { imageUrl: page3Url, status: 'completed' });

  const resRecovered = await PdfGeneratorService.generateBookPdf({ bookId: bookWithFail.id });
  assert(resRecovered.success === true, 'PDF generation succeeded after regenerating failed page');
  const recoveredBuffer = fs.readFileSync(resRecovered.filePath);
  const infoRecovered = inspectPdfBuffer(recoveredBuffer);
  assert(infoRecovered.pageCount === 3, `PDF now has all 3 pages generated (got ${infoRecovered.pageCount})`);

  // ---------------------------------------------------------------------------
  // TEST 10: Change Orientation/Size -> Images Untouched, PDF Layout Changes
  // ---------------------------------------------------------------------------
  console.log('\n[Test 10/13] Change orientation/size -> Images untouched, PDF layout changes...');
  const page1PathBefore = imageStorage.getFilePath(bookWithFail.id, 1);
  const page1MtimeBefore = fs.statSync(page1PathBefore).mtimeMs;

  // Generate Letter Landscape
  const resNewLayout = await PdfGeneratorService.generateBookPdf({
    bookId: bookWithFail.id,
    paperSize: 'LETTER',
    orientation: 'LANDSCAPE',
  });
  const page1MtimeAfter = fs.statSync(page1PathBefore).mtimeMs;
  assert(page1MtimeBefore === page1MtimeAfter, 'Underlying coloring page images were not modified or regenerated');

  const pdfNewLayoutBuffer = fs.readFileSync(resNewLayout.filePath);
  const infoNewLayout = inspectPdfBuffer(pdfNewLayoutBuffer);
  assert(infoNewLayout.widths.some((w) => Math.abs(w - 792) < 1), 'PDF layout changed to Landscape width (792 pt)');

  // ---------------------------------------------------------------------------
  // TEST 11: GET Download Endpoint Returns 200 application/pdf with Attachment Header
  // ---------------------------------------------------------------------------
  console.log('\n[Test 11/13] Testing GET /api/books/:id/pdf HTTP download endpoint...');
  const httpCreateRes = await fetch('http://localhost:5000/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Magical space kittens',
      ageGroup: 'children',
      pageCount: 2,
    }),
  });
  const httpCreateData: any = await httpCreateRes.json();
  const httpBookId = httpCreateData.book.id;

  // Populate 2 pages for HTTP book
  const p1Gen = await new TestImageProvider().generateImage({ bookId: httpBookId, pageNumber: 1, theme: 'Space', concept: 'Cat in rocket', ageGroup: 'children' });
  const p1Url = await imageStorage.saveImage(p1Gen.buffer, httpBookId, 1);
  const p2Gen = await new TestImageProvider().generateImage({ bookId: httpBookId, pageNumber: 2, theme: 'Space', concept: 'Cat on moon', ageGroup: 'children' });
  const p2Url = await imageStorage.saveImage(p2Gen.buffer, httpBookId, 2);

  await fetch(`http://localhost:5000/api/books/${httpBookId}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pages: [
        { pageNumber: 1, concept: 'Cat in rocket', imageUrl: p1Url, status: 'completed' },
        { pageNumber: 2, concept: 'Cat on moon', imageUrl: p2Url, status: 'completed' },
      ],
    }),
  });

  // Call POST /api/books/:id/pdf to trigger PDF generation via HTTP
  const httpPdfGenRes = await fetch(`http://localhost:5000/api/books/${httpBookId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperSize: 'A4', orientation: 'PORTRAIT' }),
  });
  assert(httpPdfGenRes.status === 200, `POST /api/books/:id/pdf returned HTTP 200 (got ${httpPdfGenRes.status})`);

  // Call GET /api/books/:id/pdf to download
  const response = await fetch(`http://localhost:5000/api/books/${httpBookId}/pdf`);
  assert(response.status === 200, `GET /api/books/:id/pdf returned HTTP 200 (got ${response.status})`);
  const contentType = response.headers.get('content-type');
  assert(contentType?.includes('application/pdf') === true, `Content-Type is application/pdf (got ${contentType})`);
  const contentDisposition = response.headers.get('content-disposition');
  assert(contentDisposition?.includes('attachment') === true, `Content-Disposition has attachment (got ${contentDisposition})`);
  assert(contentDisposition?.includes('.pdf') === true, `Content-Disposition filename has .pdf extension (got ${contentDisposition})`);
  const downloadedBytes = await response.arrayBuffer();
  assert(downloadedBytes.byteLength > 5000, `Downloaded PDF payload has valid size (${downloadedBytes.byteLength} bytes)`);

  // ---------------------------------------------------------------------------
  // TEST 12: Invalid Paper Size Returns 400 Validation Error
  // ---------------------------------------------------------------------------
  console.log('\n[Test 12/13] Testing Invalid Paper Size returns 400 validation error...');
  const invalidPaperRes = await fetch(`http://localhost:5000/api/books/${httpBookId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperSize: 'INVALID_SIZE', orientation: 'PORTRAIT' }),
  });
  assert(invalidPaperRes.status === 400, `Invalid paper size rejected with HTTP 400 (got ${invalidPaperRes.status})`);
  const invalidPaperBody: any = await invalidPaperRes.json();
  assert(invalidPaperBody.success === false && Boolean(invalidPaperBody.error), 'Response body contains success: false and error details');

  // ---------------------------------------------------------------------------
  // TEST 13: Invalid Orientation Returns 400 Validation Error
  // ---------------------------------------------------------------------------
  console.log('\n[Test 13/13] Testing Invalid Orientation returns 400 validation error...');
  const invalidOrientRes = await fetch(`http://localhost:5000/api/books/${httpBookId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperSize: 'A4', orientation: 'DIAGONAL' }),
  });
  assert(invalidOrientRes.status === 400, `Invalid orientation rejected with HTTP 400 (got ${invalidOrientRes.status})`);
  const invalidOrientBody: any = await invalidOrientRes.json();
  assert(invalidOrientBody.success === false && Boolean(invalidOrientBody.error), 'Response body contains success: false and error details');

  // Cleanup test artifacts
  await imageStorage.deleteBookImages(book3.id);
  await imageStorage.deleteBookImages(book8.id);
  await imageStorage.deleteBookImages(bookWithFail.id);
  await imageStorage.deleteBookImages(httpBookId);
  await pdfStorage.deletePdf(book3.id);
  await pdfStorage.deletePdf(book8.id);
  await pdfStorage.deletePdf(bookWithFail.id);
  await pdfStorage.deletePdf(httpBookId);

  console.log('\n======================================================');
  console.log(`  ALL ${passedTests} OF ${totalTests} PDF TESTS PASSED CLEANLY! ✓`);
  console.log('======================================================\n');
}

runPdfTests().catch((err) => {
  console.error('\n❌ PDF TEST SUITE FAILED:', err);
  process.exit(1);
});
