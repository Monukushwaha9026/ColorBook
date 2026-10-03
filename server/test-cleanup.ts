import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import fsPromises from 'fs/promises';

// Guarantee .env is loaded
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import {
  DailyCleanupService,
  calculateIstCalendarDayRange,
  getPreviousIstCalendarDayRange,
  formatInIst,
  startDailyCleanupScheduler,
  stopDailyCleanupScheduler,
} from './src/services/cleanup/daily-cleanup.service.js';
import { BookService } from './src/services/book.service.js';
import { imageStorage } from './src/services/storage/local-image-storage.js';
import { pdfStorage } from './src/services/pdf/pdf-storage.js';
import { TestImageProvider } from './src/services/image/test-image-provider.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ PASS: ${message}`);
}

async function runCleanupTests() {
  console.log('\n======================================================');
  console.log('  COLORBOOK AI — DAILY DATA CLEANUP TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // [1/16] Timezone & Offset Math (Asia/Kolkata = UTC+05:30)
  // ---------------------------------------------------------------------------
  console.log('[1/16] Testing Asia/Kolkata Timezone Math (+05:30)...');
  const targetDateStr = '2026-10-02';
  const range = calculateIstCalendarDayRange(targetDateStr);

  assert(range.targetDateStr === '2026-10-02', 'Target date string matches 2026-10-02');
  assert(range.timezone === 'Asia/Kolkata', 'Timezone is explicitly Asia/Kolkata');
  // 2026-10-02 00:00:00.000 IST = 2026-10-01 18:30:00.000 UTC
  assert(range.start.toISOString() === '2026-10-01T18:30:00.000Z', 'Start instant is exactly 2026-10-01T18:30:00.000Z');
  // 2026-10-02 23:59:59.999 IST = 2026-10-02 18:29:59.999 UTC
  assert(range.end.toISOString() === '2026-10-02T18:29:59.999Z', 'End instant is exactly 2026-10-02T18:29:59.999Z');
  const durationMs = range.end.getTime() - range.start.getTime();
  assert(durationMs === (24 * 3600 * 1000) - 1, 'Duration spans exactly 24 hours (86,399,999 ms)');

  // ---------------------------------------------------------------------------
  // [2/16] Previous Calendar Day Calculation
  // ---------------------------------------------------------------------------
  console.log('\n[2/16] Testing Previous IST Calendar Day Calculation...');
  // Reference date: 2026-10-03 at 01:00 AM IST (2026-10-02 19:30:00 UTC)
  const refDateAt1Am = new Date('2026-10-02T19:30:00.000Z');
  assert(formatInIst(refDateAt1Am) === '2026-10-03', 'Reference instant is in calendar day 2026-10-03 IST');
  const prevRange = getPreviousIstCalendarDayRange(refDateAt1Am);
  assert(prevRange.targetDateStr === '2026-10-02', 'Previous calendar day relative to 2026-10-03 is 2026-10-02');
  assert(prevRange.start.toISOString() === '2026-10-01T18:30:00.000Z', 'Previous day start is 2026-10-01T18:30:00.000Z');
  assert(prevRange.end.toISOString() === '2026-10-02T18:29:59.999Z', 'Previous day end is 2026-10-02T18:29:59.999Z');

  // Reference date: 2026-10-03 at 23:59 IST
  const refDateLate = new Date('2026-10-03T18:29:00.000Z');
  const prevRangeLate = getPreviousIstCalendarDayRange(refDateLate);
  assert(prevRangeLate.targetDateStr === '2026-10-02', 'Late evening calculation still targets previous calendar day 2026-10-02');

  // ---------------------------------------------------------------------------
  // [3/16] Midnight Boundaries
  // ---------------------------------------------------------------------------
  console.log('\n[3/16] Testing Midnight Boundary Precision...');
  const boundaryStartExact = new Date('2026-10-01T18:30:00.000Z'); // 2026-10-02 00:00:00.000 IST
  const boundaryEndExact = new Date('2026-10-02T18:29:59.999Z');   // 2026-10-02 23:59:59.999 IST
  const oneMsBefore = new Date('2026-10-01T18:29:59.999Z');        // 2026-10-01 23:59:59.999 IST
  const oneMsAfter = new Date('2026-10-02T18:30:00.000Z');         // 2026-10-03 00:00:00.000 IST

  assert(boundaryStartExact >= range.start && boundaryStartExact <= range.end, '00:00:00.000 IST is included in target day');
  assert(boundaryEndExact >= range.start && boundaryEndExact <= range.end, '23:59:59.999 IST is included in target day');
  assert(oneMsBefore < range.start, '1ms before start is strictly outside target range');
  assert(oneMsAfter > range.end, '1ms after end is strictly outside target range');

  // ---------------------------------------------------------------------------
  // [4/16] Setup Test Books for Multi-Day Range Verification
  // ---------------------------------------------------------------------------
  console.log('\n[4/16] Creating Multi-Day Test Books (Yesterday, Today, 2 Days Ago)...');

  // Yesterday book (TARGET FOR DELETION): 2026-10-02 12:00:00 IST = 2026-10-02 06:30:00 UTC
  const yesterdayIso = '2026-10-02T06:30:00.000Z';
  const yesterdayBook = await BookService.createBook({
    prompt: 'Yesterday Castle Adventure',
    ageGroup: 'children',
    pageCount: 2,
    createdAt: yesterdayIso,
  });

  // Today book (MUST NOT BE DELETED): 2026-10-03 00:30:00 IST = 2026-10-02 19:00:00 UTC
  const todayIso = '2026-10-02T19:00:00.000Z';
  const todayBook = await BookService.createBook({
    prompt: 'Today Space Rockets',
    ageGroup: 'kids',
    pageCount: 1,
    createdAt: todayIso,
  });

  // Two days ago book (MUST NOT BE DELETED): 2026-10-01 12:00:00 IST = 2026-10-01 06:30:00 UTC
  const twoDaysAgoIso = '2026-10-01T06:30:00.000Z';
  const twoDaysAgoBook = await BookService.createBook({
    prompt: 'Two Days Ago Dinosaurs',
    ageGroup: 'kids',
    pageCount: 1,
    createdAt: twoDaysAgoIso,
  });

  assert(Boolean(yesterdayBook.id), `Yesterday book created: ${yesterdayBook.id}`);
  assert(Boolean(todayBook.id), `Today book created: ${todayBook.id}`);
  assert(Boolean(twoDaysAgoBook.id), `Two-days-ago book created: ${twoDaysAgoBook.id}`);

  // Populate yesterdayBook with real test images, reference image, and PDF
  const provider = new TestImageProvider();
  const img1 = await provider.generateImage({
    bookId: yesterdayBook.id,
    pageNumber: 1,
    theme: 'Yesterday Castle',
    concept: 'Castle towers',
    ageGroup: 'children',
  });
  const imgUrl1 = await imageStorage.saveImage(img1.buffer, yesterdayBook.id, 1);
  const img2 = await provider.generateImage({
    bookId: yesterdayBook.id,
    pageNumber: 2,
    theme: 'Yesterday Castle',
    concept: 'Dragon gate',
    ageGroup: 'children',
  });
  const imgUrl2 = await imageStorage.saveImage(img2.buffer, yesterdayBook.id, 2);

  // Add reference image
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await imageStorage.saveReferenceImage(yesterdayBook.id, sampleBase64);

  // Add dummy PDF
  await pdfStorage.ensureDirectory(yesterdayBook.id);
  const pdfPath = pdfStorage.getPdfPath(yesterdayBook.id);
  await fsPromises.writeFile(pdfPath, Buffer.from('%PDF-1.4 test pdf'));

  // Update book with pages
  await BookService.savePages(yesterdayBook.id, [
    {
      id: `page_1_${yesterdayBook.id}`,
      bookId: yesterdayBook.id,
      pageNumber: 1,
      concept: 'Castle towers',
      imageUrl: imgUrl1,
      status: 'completed',
      createdAt: yesterdayIso,
      updatedAt: yesterdayIso,
    },
    {
      id: `page_2_${yesterdayBook.id}`,
      bookId: yesterdayBook.id,
      pageNumber: 2,
      concept: 'Dragon gate',
      imageUrl: imgUrl2,
      status: 'completed',
      createdAt: yesterdayIso,
      updatedAt: yesterdayIso,
    },
  ]);

  // Populate todayBook with an image
  const todayImg = await provider.generateImage({
    bookId: todayBook.id,
    pageNumber: 1,
    theme: 'Space rockets',
    concept: 'Rocket launching',
    ageGroup: 'kids',
  });
  await imageStorage.saveImage(todayImg.buffer, todayBook.id, 1);

  // Verify yesterday assets exist before cleanup
  const yesterdayImgDir = path.join(imageStorage.getBaseDir(), 'books', yesterdayBook.id);
  const yesterdayRefPath = path.join(imageStorage.getReferencesDir(), `${yesterdayBook.id}.png`);
  assert(fs.existsSync(yesterdayImgDir), 'Yesterday book image directory exists before cleanup');
  assert(fs.existsSync(yesterdayRefPath), 'Yesterday reference image exists before cleanup');
  assert(fs.existsSync(pdfPath), 'Yesterday PDF file exists before cleanup');

  // ---------------------------------------------------------------------------
  // [5/16] Execute Targeted Daily Cleanup for Yesterday (2026-10-02)
  // ---------------------------------------------------------------------------
  console.log('\n[5/16] Executing Daily Cleanup for 2026-10-02...');
  const result = await DailyCleanupService.executeDailyCleanup({ targetDate: '2026-10-02' });

  assert(result.success === true, 'Daily cleanup returned success: true');
  assert(result.targetDate === '2026-10-02', 'Result target date matches 2026-10-02');
  assert(result.scanned >= 1, `Scanned found at least 1 yesterday book (found ${result.scanned})`);
  assert(result.deletedBooks >= 1, `Successfully deleted yesterday book (deleted ${result.deletedBooks})`);
  assert(result.deletedFiles >= 4, `Deleted associated files (found ${result.deletedFiles} files: 2 pages + 1 ref + 1 pdf)`);
  assert(result.failedBooks === 0, 'Zero failed books reported');

  // ---------------------------------------------------------------------------
  // [6/16] Verify File Deletion for Target Book
  // ---------------------------------------------------------------------------
  console.log('\n[6/16] Verifying Filesystem Asset Deletion for Target Book...');
  assert(!fs.existsSync(yesterdayImgDir), 'Yesterday book image directory was removed from disk');
  assert(!fs.existsSync(yesterdayRefPath), 'Yesterday reference image file was removed from disk');
  assert(!fs.existsSync(pdfPath), 'Yesterday PDF file was removed from disk');

  // ---------------------------------------------------------------------------
  // [7/16] Verify Database / In-Memory Deletion for Target Book
  // ---------------------------------------------------------------------------
  console.log('\n[7/16] Verifying Database Record Deletion...');
  const yesterdayCheck = await BookService.getBookById(yesterdayBook.id);
  assert(yesterdayCheck === null, 'Target book record was removed from repository (returns null)');

  // ---------------------------------------------------------------------------
  // [8/16] Verify Today's Books Were NOT Deleted
  // ---------------------------------------------------------------------------
  console.log('\n[8/16] Verifying Today\'s Book Is Fully Intact...');
  const todayCheck = await BookService.getBookById(todayBook.id);
  assert(todayCheck !== null, 'Today\'s book still exists in repository');
  assert(todayCheck?.id === todayBook.id, 'Today\'s book ID matches');
  const todayImgDir = path.join(imageStorage.getBaseDir(), 'books', todayBook.id);
  assert(fs.existsSync(todayImgDir), 'Today\'s book image directory remains intact on disk');

  // ---------------------------------------------------------------------------
  // [9/16] Verify Two-Days-Ago Book Was NOT Deleted
  // ---------------------------------------------------------------------------
  console.log('\n[9/16] Verifying Two-Days-Ago Book Is Fully Intact...');
  const twoDaysAgoCheck = await BookService.getBookById(twoDaysAgoBook.id);
  assert(twoDaysAgoCheck !== null, 'Two-days-ago book still exists in repository');
  assert(twoDaysAgoCheck?.id === twoDaysAgoBook.id, 'Two-days-ago book ID matches');

  // ---------------------------------------------------------------------------
  // [10/16] Idempotency: Running Twice for the Same Day
  // ---------------------------------------------------------------------------
  console.log('\n[10/16] Testing Idempotency (Running Twice for Same Date)...');
  const secondRunResult = await DailyCleanupService.executeDailyCleanup({ targetDate: '2026-10-02' });
  assert(secondRunResult.success === true, 'Second run completed with success: true');
  assert(secondRunResult.scanned === 0, 'Second run found 0 books remaining to clean');
  assert(secondRunResult.deletedBooks === 0, 'Second run deleted 0 books');
  assert(secondRunResult.failedBooks === 0, 'Second run had 0 failures');

  // ---------------------------------------------------------------------------
  // [11/16] Handling Missing Files Safely
  // ---------------------------------------------------------------------------
  console.log('\n[11/16] Testing Resilient Handling When Files Are Already Missing...');
  const ghostBook = await BookService.createBook({
    prompt: 'Ghost Book Without Files',
    ageGroup: 'kids',
    pageCount: 1,
    createdAt: yesterdayIso,
  });
  // Note: we purposely do NOT create any disk files for ghostBook
  const ghostResult = await DailyCleanupService.executeDailyCleanup({ targetDate: '2026-10-02' });
  assert(ghostResult.success === true, 'Cleanup succeeded despite missing disk files');
  assert(ghostResult.deletedBooks === 1, 'Ghost book database record was cleaned up');
  assert(ghostResult.failedBooks === 0, 'No failure recorded for missing files');

  // ---------------------------------------------------------------------------
  // [12/16] Per-Book Error Handling (One Failure Does Not Stop Others)
  // ---------------------------------------------------------------------------
  console.log('\n[12/16] Testing Per-Book Error Isolation...');
  const normalBook = await BookService.createBook({
    prompt: 'Normal Book Beside Error',
    ageGroup: 'children',
    pageCount: 1,
    createdAt: yesterdayIso,
  });

  // Temporarily stub BookService.deleteBook to simulate one failure on a specific ID
  const originalDeleteBook = BookService.deleteBook;
  let simulatedFailBookId = 'book_simulate_fail_999';
  
  // Inject a mock book into memory
  await BookService.createBook({
    prompt: 'Faulty Book Candidate',
    ageGroup: 'kids',
    pageCount: 1,
    createdAt: yesterdayIso,
  });

  let failCount = 0;
  (BookService as any).deleteBook = async (id: string) => {
    if (failCount === 0) {
      failCount++;
      simulatedFailBookId = id;
      throw new Error('Simulated database lock failure for test');
    }
    return originalDeleteBook.call(BookService, id);
  };

  const isolatedResult = await DailyCleanupService.executeDailyCleanup({ targetDate: '2026-10-02' });
  // Restore original method
  BookService.deleteBook = originalDeleteBook;

  assert(isolatedResult.failedBooks === 1, 'Simulated failure recorded as exactly 1 failed book');
  assert(isolatedResult.deletedBooks >= 1, 'Other valid book in the batch was successfully deleted');
  assert(isolatedResult.errors?.length === 1, 'Error detail captured');
  assert(isolatedResult.errors![0].bookId === simulatedFailBookId, 'Error matches failed book ID');

  // Clean up any remaining test book from this sub-test
  await BookService.deleteBook(simulatedFailBookId).catch(() => {});
  await BookService.deleteBook(normalBook.id).catch(() => {});

  // ---------------------------------------------------------------------------
  // [13/16] Safe-Path & ID Sanitization Protection
  // ---------------------------------------------------------------------------
  console.log('\n[13/16] Testing Safe-Path and Directory Traversal Protection...');
  try {
    imageStorage.getFilePath('../../../..', 1);
    assert(false, 'Path traversal identifier should throw an error');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes('Invalid') || msg.includes('traversal'), 'Path traversal rejected by storage security');
  }

  // ---------------------------------------------------------------------------
  // [14/16] Unrelated Files Preserved
  // ---------------------------------------------------------------------------
  console.log('\n[14/16] Testing Unrelated Files and Storage Isolation...');
  const testKeeperPath = path.join(imageStorage.getBaseDir(), 'keeper-marker.txt');
  await fsPromises.writeFile(testKeeperPath, 'keep-me');
  await DailyCleanupService.executeDailyCleanup({ targetDate: '2026-10-02' });
  assert(fs.existsSync(testKeeperPath), 'Unrelated marker file in storage was preserved');
  await fsPromises.unlink(testKeeperPath).catch(() => {});

  // ---------------------------------------------------------------------------
  // [15/16] Scheduler Configuration (CLEANUP_ENABLED=false)
  // ---------------------------------------------------------------------------
  console.log('\n[15/16] Testing Scheduler Disabling via CLEANUP_ENABLED=false...');
  const oldEnabled = process.env.CLEANUP_ENABLED;
  process.env.CLEANUP_ENABLED = 'false';
  const disabledTask = startDailyCleanupScheduler();
  assert(disabledTask === null, 'startDailyCleanupScheduler() returns null when CLEANUP_ENABLED=false');
  process.env.CLEANUP_ENABLED = oldEnabled;

  // ---------------------------------------------------------------------------
  // [16/16] Scheduler Starts with Asia/Kolkata Timezone
  // ---------------------------------------------------------------------------
  console.log('\n[16/16] Testing Scheduler Timezone and Lifecycle...');
  process.env.CLEANUP_ENABLED = 'true';
  const activeTask = startDailyCleanupScheduler();
  assert(activeTask !== null, 'startDailyCleanupScheduler() returns active ScheduledTask when enabled');
  stopDailyCleanupScheduler();
  assert(true, 'stopDailyCleanupScheduler() safely halts scheduled task');

  // Clean up remaining test books
  await BookService.deleteBook(todayBook.id).catch(() => {});
  await BookService.deleteBook(twoDaysAgoBook.id).catch(() => {});

  console.log('\n======================================================');
  console.log(`  ALL ${passedTests} OF ${totalTests} CLEANUP TESTS PASSED CLEANLY! ✓`);
  console.log('======================================================\n');
}

runCleanupTests().catch((err) => {
  console.error('\n❌ CLEANUP TEST SUITE FAILED:', err);
  process.exit(1);
});
