import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { TestImageProvider } from './src/services/image/test-image-provider.js';
import { imageStorage } from './src/services/storage/local-image-storage.js';
import { pdfStorage } from './src/services/pdf/pdf-storage.js';
import { createRateLimiter } from './src/middleware/rateLimiter.js';

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

async function runPhase3Tests() {
  console.log('\n======================================================');
  console.log('  COLORBOOK AI — PHASE 3: MY BOOKS & SECURITY SUITE');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:5000';

  // ---------------------------------------------------------------------------
  // 1. In-Memory Rate Limiter Verification
  // ---------------------------------------------------------------------------
  console.log('[1/6] Testing In-Memory Rate Limiter...');
  const testLimiter = createRateLimiter({
    windowMs: 1000,
    max: 3,
    skipInTest: false,
  });

  let blocked = false;
  let retryAfterHeader = '';
  let statusCode = 200;

  const fakeReq = { ip: '127.0.0.99', headers: {} } as any;
  const runReq = () => {
    let nextCalled = false;
    const fakeRes = {
      setHeader: (key: string, val: string) => {
        if (key === 'Retry-After') retryAfterHeader = val;
      },
    } as any;

    try {
      testLimiter(fakeReq, fakeRes, () => {
        nextCalled = true;
      });
    } catch (err: any) {
      if (err.statusCode === 429) {
        blocked = true;
        statusCode = 429;
      }
    }
    return nextCalled;
  };

  assert(runReq() === true, 'Request 1/3 allowed');
  assert(runReq() === true, 'Request 2/3 allowed');
  assert(runReq() === true, 'Request 3/3 allowed');
  assert(runReq() === false, 'Request 4/3 blocked by rate limiter');
  assert(blocked && statusCode === 429, 'Rate limiter threw 429 error');
  assert(Boolean(retryAfterHeader), `Rate limiter included Retry-After header: ${retryAfterHeader}s`);

  // ---------------------------------------------------------------------------
  // 2. Storage Security & Path Traversal Validation
  // ---------------------------------------------------------------------------
  console.log('\n[2/6] Testing Security & Parameter Sanitization...');
  
  // Test invalid book IDs on API endpoints
  const traversalRes = await fetch(`${BASE_URL}/api/books/..%2F..%2Fetc`);
  assert(traversalRes.status === 400, `Path traversal attempt on /api/books/:id rejected with 400 (got ${traversalRes.status})`);
  const traversalBody: any = await traversalRes.json();
  assert(traversalBody.error?.code === 'INVALID_BOOK_ID', `Error code is INVALID_BOOK_ID (got ${traversalBody.error?.code})`);

  const invalidPageRes = await fetch(`${BASE_URL}/api/books/valid_id_123/pages/abc/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert(invalidPageRes.status === 400, `Non-numeric page number rejected with 400 (got ${invalidPageRes.status})`);

  const negativePageRes = await fetch(`${BASE_URL}/api/books/valid_id_123/pages/-1`, {
    method: 'DELETE',
  });
  assert(negativePageRes.status === 400, `Negative page number rejected with 400 (got ${negativePageRes.status})`);

  // ---------------------------------------------------------------------------
  // 3. Create a Book & Populate Pages for My Books Testing
  // ---------------------------------------------------------------------------
  console.log('\n[3/6] Creating Book with Reference Image & Pages...');

  // 1x1 transparent PNG as base64
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const createRes = await fetch(`${BASE_URL}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Enchanted Woodland Fairies',
      ageGroup: 'children',
      pageCount: 3,
      referenceImage: sampleBase64,
    }),
  });
  assert(createRes.ok, `Book created successfully with HTTP ${createRes.status}`);
  const { book } = (await createRes.json()) as any;
  const bookId = book.id;
  assert(Boolean(bookId), `Book ID generated: ${bookId}`);

  // Generate 3 sample pages
  const provider = new TestImageProvider();
  const pagesData = [];
  for (let i = 1; i <= 3; i++) {
    const gen = await provider.generateImage({
      bookId,
      pageNumber: i,
      theme: 'Woodland Fairies',
      concept: `Fairy scene ${i}`,
      ageGroup: 'children',
    });
    const url = await imageStorage.saveImage(gen.buffer, bookId, i);
    pagesData.push({
      pageNumber: i,
      concept: `Fairy scene ${i}`,
      imageUrl: url,
      status: 'completed',
    });
  }

  const savePagesRes = await fetch(`${BASE_URL}/api/books/${bookId}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages: pagesData }),
  });
  assert(savePagesRes.ok, 'Pages saved and completed for test book');

  // ---------------------------------------------------------------------------
  // 4. My Books Listing & Reopening
  // ---------------------------------------------------------------------------
  console.log('\n[4/6] Testing GET /api/books (My Books Listing) & Reopening...');
  const listRes = await fetch(`${BASE_URL}/api/books`);
  assert(listRes.ok, `GET /api/books returned HTTP ${listRes.status}`);
  const listBody: any = await listRes.json();
  assert(listBody.success === true, 'Response indicates success: true');
  assert(Array.isArray(listBody.books), 'Response books is an array');

  const foundBook = listBody.books.find((b: any) => b.id === bookId);
  assert(Boolean(foundBook), `Newly created book ${bookId} found in list`);
  assert(foundBook.completedPages === 3, `Book has completedPages: 3 (got ${foundBook.completedPages})`);
  assert(foundBook.pageCount === 3, `Book has pageCount: 3 (got ${foundBook.pageCount})`);
  assert(Boolean(foundBook.coverImage), `Book has a coverImage thumbnail: ${foundBook.coverImage}`);

  // Reopen single book
  const reopenRes = await fetch(`${BASE_URL}/api/books/${bookId}`);
  assert(reopenRes.ok, `Reopen GET /api/books/:id returned HTTP ${reopenRes.status}`);
  const reopenBody: any = await reopenRes.json();
  assert(reopenBody.book?.id === bookId, 'Reopened book has matching ID');
  assert(reopenBody.book?.pages?.length === 3, 'Reopened book contains all 3 pages');

  // ---------------------------------------------------------------------------
  // 5. PDF Invalidation Cycle: Generate -> Stale on Edit -> Recompile
  // ---------------------------------------------------------------------------
  console.log('\n[5/6] Testing PDF Invalidation on Edit & Download Blocking...');

  // Compile PDF
  const genPdfRes = await fetch(`${BASE_URL}/api/books/${bookId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperSize: 'A4', orientation: 'PORTRAIT' }),
  });
  assert(genPdfRes.ok, `PDF compilation returned HTTP ${genPdfRes.status}`);
  const genPdfBody: any = await genPdfRes.json();
  assert(genPdfBody.pdfStatus === 'completed', `pdfStatus is 'completed' (got ${genPdfBody.pdfStatus})`);

  // Download PDF succeeds
  const dlRes1 = await fetch(`${BASE_URL}/api/books/${bookId}/pdf`);
  assert(dlRes1.status === 200, `Download PDF succeeds with HTTP 200 before edit`);

  // Edit action 1: Delete a page
  const deletePageRes = await fetch(`${BASE_URL}/api/books/${bookId}/pages/3`, {
    method: 'DELETE',
  });
  assert(deletePageRes.ok, 'Page 3 deleted');

  // Check that book's pdfStatus is now stale
  const staleBookRes = await fetch(`${BASE_URL}/api/books/${bookId}`);
  const staleBookBody: any = await staleBookRes.json();
  assert(staleBookBody.book?.pdfStatus === 'stale', `Book pdfStatus transitioned to 'stale' after page deletion (got ${staleBookBody.book?.pdfStatus})`);

  // Attempting to download the stale PDF must return HTTP 409
  const dlStaleRes = await fetch(`${BASE_URL}/api/books/${bookId}/pdf`);
  assert(dlStaleRes.status === 409, `Download of stale PDF rejected with HTTP 409 (got ${dlStaleRes.status})`);
  const dlStaleBody: any = await dlStaleRes.json();
  assert(dlStaleBody.error?.code === 'PDF_STALE', `Error code is PDF_STALE (got ${dlStaleBody.error?.code})`);

  // Recompile PDF
  const recompilePdfRes = await fetch(`${BASE_URL}/api/books/${bookId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperSize: 'LETTER', orientation: 'PORTRAIT' }),
  });
  assert(recompilePdfRes.ok, 'PDF recompiled successfully');
  const recompiledBody: any = await recompilePdfRes.json();
  assert(recompiledBody.pdfStatus === 'completed', 'pdfStatus returned to completed after recompile');

  // Download now succeeds again
  const dlRes2 = await fetch(`${BASE_URL}/api/books/${bookId}/pdf`);
  assert(dlRes2.status === 200, 'Download PDF succeeds with HTTP 200 after recompile');

  // Edit action 2: Regenerate page 1 -> pdfStatus becomes stale again
  const regenRes = await fetch(`${BASE_URL}/api/books/${bookId}/pages/1/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert(regenRes.ok, 'Page 1 regeneration triggered');
  const bookAfterRegenRes = await fetch(`${BASE_URL}/api/books/${bookId}`);
  const bookAfterRegen: any = await bookAfterRegenRes.json();
  assert(bookAfterRegen.book?.pdfStatus === 'stale', `Book pdfStatus became 'stale' after page regeneration`);

  // ---------------------------------------------------------------------------
  // 6. Complete Book Deletion & Storage Cleanup
  // ---------------------------------------------------------------------------
  console.log('\n[6/6] Testing Book Deletion & Disk Cleanup...');

  // Verify files exist before deletion
  const bookImgDir = path.resolve(process.cwd(), 'storage/images/books', bookId);
  const bookPdfDir = path.resolve(process.cwd(), 'storage/pdfs/books', bookId);
  assert(fs.existsSync(bookImgDir), `Image directory exists before deletion: ${bookImgDir}`);

  // Delete book via DELETE /api/books/:id
  const delBookRes = await fetch(`${BASE_URL}/api/books/${bookId}`, {
    method: 'DELETE',
  });
  assert(delBookRes.ok, `DELETE /api/books/:id returned HTTP ${delBookRes.status}`);

  // Verify disk cleanup
  assert(!fs.existsSync(bookImgDir), 'Book image directory was removed from disk');
  assert(!fs.existsSync(bookPdfDir), 'Book PDF directory was removed from disk');

  // Verify 404 on subsequent get
  const notFoundRes = await fetch(`${BASE_URL}/api/books/${bookId}`);
  assert(notFoundRes.status === 404, `Deleted book returns HTTP 404 (got ${notFoundRes.status})`);

  console.log('\n======================================================');
  console.log(`  ALL ${passedTests} OF ${totalTests} PHASE 3 TESTS PASSED CLEANLY! ✓`);
  console.log('======================================================\n');
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});
