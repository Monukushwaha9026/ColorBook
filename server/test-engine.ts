import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { ImagePromptBuilder } from './src/services/image/image-prompt-builder.js';
import { ImageValidator } from './src/services/image/image-validator.js';
import { LocalImageProvider } from './src/services/image/local-image-provider.js';
import { FreeImageProvider } from './src/services/image/free-image-provider.js';
import { ImageProviderService } from './src/services/image/image-provider.service.js';
import { imageStorage } from './src/services/storage/local-image-storage.js';
import { BookService } from './src/services/book.service.js';
import { BookGenerationService } from './src/services/ai/book-generation.service.js';
import { BookPlannerService } from './src/services/ai/book-planner.service.js';
import { AppError } from './src/middleware/errorHandler.js';
import type { ImageProvider, ImageGenerationInput, GeneratedImage } from './src/services/image/image-provider.interface.js';
import type { AIProvider, BookPlan, BookPlanInput } from './src/services/ai/ai-provider.interface.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  COLORBOOK AI — COMPLETE ENGINE TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // TEST 1: Image Prompt Builder for All 4 Age Groups
  // ---------------------------------------------------------------------------
  console.log('[1/12] Testing Prompt Generation for All 4 Age Groups...');
  const ageGroups = ['kids', 'children', 'teens', 'teen_plus'] as const;
  for (const age of ageGroups) {
    const prompt = ImagePromptBuilder.build({
      bookTitle: 'Space Explorers',
      theme: 'Space adventure',
      concept: 'Astronaut planting a flag on Mars',
      ageGroup: age,
      pageNumber: 1,
    });

    assert(prompt.prompt.includes('coloring book page'), `Prompt for ${age} includes "coloring book page"`);
    assert(prompt.prompt.includes('black and white line art'), `Prompt for ${age} includes "black and white line art"`);
    assert(prompt.negativePrompt.includes('color'), `Negative prompt for ${age} excludes color`);

    const lower = prompt.prompt.toLowerCase();
    if (age === 'kids') {
      assert(lower.includes('thick') && lower.includes('outlines'), 'Kids prompt has thick outlines guidance');
    } else if (age === 'children') {
      assert(lower.includes('medium') && lower.includes('outlines'), 'Children prompt has medium outlines');
    } else if (age === 'teens') {
      assert(lower.includes('fine') || lower.includes('patterns'), 'Teens prompt has detailed linework');
    } else if (age === 'teen_plus') {
      assert(lower.includes('intricate') || lower.includes('complex'), 'Teen+ prompt has intricate linework');
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Safety Prompt Sanitization
  // ---------------------------------------------------------------------------
  console.log('\n[2/12] Testing Safety Prompt Sanitization...');
  const unsafeConcept = 'Bloody battle with severed heads, gory violence and zombies';
  const safePrompt = ImagePromptBuilder.build({
    theme: 'Horror monsters',
    concept: unsafeConcept,
    ageGroup: 'children',
    pageNumber: 2,
  });

  assert(!safePrompt.prompt.toLowerCase().includes('bloody'), 'Sanitization removes "bloody"');
  assert(!safePrompt.prompt.toLowerCase().includes('severed'), 'Sanitization removes "severed"');
  assert(!safePrompt.prompt.toLowerCase().includes('gory'), 'Sanitization removes "gory"');
  assert(!safePrompt.prompt.toLowerCase().includes('violence'), 'Sanitization removes "violence"');
  assert(safePrompt.prompt.includes('friendly') || safePrompt.prompt.includes('playful'), 'Unsafe words sanitized to friendly/playful terms');

  // ---------------------------------------------------------------------------
  // TEST 3: FreeImageProvider Line Art Generation
  // ---------------------------------------------------------------------------
  console.log('\n[3/12] Testing FreeImageProvider Generation...');
  const freeProvider = new FreeImageProvider();
  const genResult = await freeProvider.generateImage({
    bookId: 'test-book',
    pageNumber: 1,
    theme: 'Ocean underwater',
    concept: 'Dolphin jumping over gentle waves',
    ageGroup: 'children',
  });

  assert(Buffer.isBuffer(genResult.buffer), 'Generated result contains a Buffer');
  assert(genResult.buffer.length > 1000, `Buffer size is adequate (${genResult.buffer.length} bytes)`);
  assert(genResult.width >= 512, `Width is >= 512px (${genResult.width}px)`);
  assert(genResult.height >= 512, `Height is >= 512px (${genResult.height}px)`);

  // ---------------------------------------------------------------------------
  // TEST 4: Image Validation Rules
  // ---------------------------------------------------------------------------
  console.log('\n[4/12] Testing Image Quality and Format Validation...');
  // 4a. Valid PNG passes
  const validCheck = ImageValidator.validate(genResult.buffer);
  assert(validCheck.valid, `Valid PNG passes validation (score: ${validCheck.score})`);

  // 4b. Corrupt buffer fails
  const corruptBuffer = Buffer.alloc(1024, 0x41); // 1024 bytes of 'A', not an image
  const corruptCheck = ImageValidator.validate(corruptBuffer);
  assert(!corruptCheck.valid, 'Corrupt buffer is rejected by validator');
  assert(corruptCheck.reasons.some((r) => r.toLowerCase().includes('signature') || r.toLowerCase().includes('png')), 'Rejection mentions image signature/format');

  // 4c. Tiny buffer fails
  const tinyBuffer = Buffer.alloc(10);
  const tinyCheck = ImageValidator.validate(tinyBuffer);
  assert(!tinyCheck.valid, 'Tiny buffer is rejected by validator');

  // ---------------------------------------------------------------------------
  // TEST 5: Automatic 3-Attempt Retry Loop
  // ---------------------------------------------------------------------------
  console.log('\n[5/12] Testing 3-Attempt Retry Loop on Validation Failure...');
  let callCount = 0;
  const flakyProvider: ImageProvider = {
    name: 'flaky-test-provider',
    async generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
      callCount++;
      if (callCount < 3) {
        // Return corrupt buffer on attempts 1 & 2
        return {
          buffer: Buffer.from('FAKE_CORRUPT_DATA'),
          mimeType: 'image/png',
          width: 800,
          height: 1000,
        };
      }
      // Return valid image on attempt 3
      return genResult;
    },
  };

  ImageProviderService.setProvider(flakyProvider);
  const retryResult = await ImageProviderService.generateValidatedImage({
    bookId: 'test-retry',
    pageNumber: 1,
    theme: 'Space',
    concept: 'Stars and moons',
    ageGroup: 'kids',
  });

  assert(retryResult.attempts === 3, `Retry loop executed exactly 3 attempts (got ${retryResult.attempts})`);
  assert(retryResult.validation.valid, 'Final attempt succeeded and passed validation');

  // 5b. Permanent failure throws after 3 attempts
  let alwaysFailCount = 0;
  const failingProvider: ImageProvider = {
    name: 'failing-test-provider',
    async generateImage(): Promise<GeneratedImage> {
      alwaysFailCount++;
      return {
        buffer: Buffer.from('CORRUPT'),
        mimeType: 'image/png',
        width: 10,
        height: 10,
      };
    },
  };

  ImageProviderService.setProvider(failingProvider);
  let caughtError: AppError | null = null;
  try {
    await ImageProviderService.generateValidatedImage({
      bookId: 'test-fail',
      pageNumber: 1,
      theme: 'Fail',
      concept: 'Fail',
      ageGroup: 'kids',
    });
  } catch (err) {
    caughtError = err as AppError;
  }

  assert(caughtError !== null, 'Permanent validation failure throws error');
  assert(alwaysFailCount === 3, `Tried exactly 3 attempts before aborting (got ${alwaysFailCount})`);
  assert(caughtError?.code === 'IMAGE_GENERATION_FAILED', `Error code is IMAGE_GENERATION_FAILED (${caughtError?.code})`);

  // Switch to FreeImageProvider for remaining tests
  ImageProviderService.setProvider(freeProvider);

  // ---------------------------------------------------------------------------
  // TEST 6: Local Provider Offline Graceful Error
  // ---------------------------------------------------------------------------
  console.log('\n[6/12] Testing Local Provider Offline Handling...');
  // Force local provider with unreachable port
  const offlineLocalProvider = new LocalImageProvider('http://127.0.0.1:59998');
  let offlineError: AppError | null = null;
  try {
    await offlineLocalProvider.generateImage({
      bookId: 'offline-test',
      pageNumber: 1,
      theme: 'Testing',
      concept: 'Testing offline',
      ageGroup: 'kids',
    });
  } catch (err) {
    offlineError = err as AppError;
  }

  assert(offlineError !== null, 'Offline local provider throws error');
  assert(offlineError?.code === 'LOCAL_IMAGE_PROVIDER_UNAVAILABLE', `Error code is LOCAL_IMAGE_PROVIDER_UNAVAILABLE (${offlineError?.code})`);
  assert(offlineError?.message.includes('unavailable') || offlineError?.message.includes('local AI service'), 'Error message provides actionable local setup guidance');

  // ---------------------------------------------------------------------------
  // TEST 7: Local Image Storage Service
  // ---------------------------------------------------------------------------
  console.log('\n[7/12] Testing Local Image Storage (Save, Get, Delete)...');
  const testStorageBookId = 'test-storage-book-123';
  const savedUrl = await imageStorage.saveImage(genResult.buffer, testStorageBookId, 1);
  assert(savedUrl.startsWith('/storage/images/books/test-storage-book-123/'), `Image saved with correct public URL (${savedUrl})`);

  const diskPath = imageStorage.getFilePath(testStorageBookId, 1);
  assert(diskPath !== null && fs.existsSync(diskPath), `Stored file exists on disk at ${diskPath}`);

  await imageStorage.deleteBookImages(testStorageBookId);
  const deletedCheck = imageStorage.getFilePath(testStorageBookId, 1);
  assert(!fs.existsSync(deletedCheck), 'Book images cleaned up successfully after deletion');

  // ---------------------------------------------------------------------------
  // TEST 8: End-to-End Book Planning & Background Generation Orchestration
  // ---------------------------------------------------------------------------
  console.log('\n[8/12] Testing Book Generation Orchestration...');

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('  (Using Mock AI Planner for offline test execution)');
    const mockAIProvider: AIProvider = {
      name: 'mock-gemini-test',
      async generateBookPlan(input: BookPlanInput): Promise<BookPlan> {
        return {
          title: 'Enchanted Forest Adventure',
          theme: input.prompt,
          ageGroup: input.ageGroup,
          pageCount: input.pageCount,
          pages: Array.from({ length: input.pageCount }, (_, i) => ({
            pageNumber: i + 1,
            concept: `Enchanted forest scene ${i + 1} with cute animals`,
            difficulty: 'simple',
            visualPrompt: `Cute woodland animal ${i + 1} in a gentle forest`,
          })),
        };
      },
    };
    BookPlannerService.setProvider(mockAIProvider);
  }

  const testBook = await BookService.createBook({
    prompt: 'Enchanted forest with friendly woodland creatures',
    ageGroup: 'kids',
    pageCount: 3,
  });

  assert(testBook.status === 'planning' || testBook.status === 'draft', `Initial book status is planning/draft (${testBook.status})`);

  // Plan book
  const { book: plannedBook, pages: plannedPages } = await BookService.planBook(testBook.id);
  assert(plannedBook.status === 'generating' || plannedBook.status === 'planned', `Book status is ${plannedBook.status}`);
  assert(plannedPages.length === 3, 'Book has exactly 3 planned page concepts');
  assert(plannedPages[0].status === 'planned', 'Pages have planned status');

  // Start background generation
  await BookGenerationService.startBookGeneration(testBook.id);
  const generatingBook = await BookService.getBookById(testBook.id);
  assert(generatingBook?.status === 'generating', 'Book status is generating after startBookGeneration');

  // ---------------------------------------------------------------------------
  // TEST 9: Duplicate Generation Job Prevention
  // ---------------------------------------------------------------------------
  console.log('\n[9/12] Testing Duplicate Generation Job Prevention...');
  // Calling startBookGeneration while already in progress should safely return
  await BookGenerationService.startBookGeneration(testBook.id);
  assert(true, 'Duplicate startBookGeneration call ignored without errors');

  // Wait for background generation to finish (poll up to 30s)
  console.log('  Waiting for background worker to complete generation...');
  let completedBook = await BookService.getBookById(testBook.id);
  let pollAttempts = 0;
  while (completedBook?.status === 'generating' && pollAttempts < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    completedBook = await BookService.getBookById(testBook.id);
    pollAttempts++;
  }

  assert(completedBook?.status === 'completed', `Book completed background generation (Status: ${completedBook?.status})`);
  assert(completedBook?.completedPages === 3, `All 3 pages completed (completedPages: ${completedBook?.completedPages})`);

  for (const page of completedBook?.pages || []) {
    assert(page.status === 'completed', `Page ${page.pageNumber} status is completed`);
    assert((page.validationScore || 0) >= 0.7, `Page ${page.pageNumber} has validation score >= 0.7 (${page.validationScore})`);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Single Page Regeneration (Preserves Other Pages)
  // ---------------------------------------------------------------------------
  console.log('\n[10/12] Testing Single Page Regeneration...');
  const page1UrlBefore = completedBook!.pages[0].imageUrl;
  const page2UrlBefore = completedBook!.pages[1].imageUrl;
  const page3UrlBefore = completedBook!.pages[2].imageUrl;

  const regeneratedPage2 = await BookGenerationService.regenerateSinglePage(testBook.id, 2);
  assert(regeneratedPage2.status === 'completed', 'Regenerated page 2 is completed');

  const afterRegenBook = await BookService.getBookById(testBook.id);
  const page1UrlAfter = afterRegenBook!.pages[0].imageUrl;
  const page3UrlAfter = afterRegenBook!.pages[2].imageUrl;

  assert(page1UrlBefore === page1UrlAfter, 'Page 1 imageUrl preserved during page 2 regeneration');
  assert(page3UrlBefore === page3UrlAfter, 'Page 3 imageUrl preserved during page 2 regeneration');

  // ---------------------------------------------------------------------------
  // TEST 11: Single Page Deletion and Sequential Renumbering
  // ---------------------------------------------------------------------------
  console.log('\n[11/12] Testing Single Page Deletion & Sequential Renumbering...');
  const beforeCount = afterRegenBook!.pages.length;
  const deletedPageResult = await BookService.deletePage(testBook.id, 2);

  assert(deletedPageResult.pageCount === beforeCount - 1, `Page count reduced from ${beforeCount} to ${deletedPageResult.pageCount}`);
  assert(deletedPageResult.pages.length === 2, 'Book now has 2 pages remaining');
  assert(deletedPageResult.pages[0].pageNumber === 1, 'Remaining page 1 has pageNumber 1');
  assert(deletedPageResult.pages[1].pageNumber === 2, 'Remaining page 2 (previously page 3) was sequentially renumbered to 2');

  // ---------------------------------------------------------------------------
  // TEST 12: Cancellation Handling
  // ---------------------------------------------------------------------------
  console.log('\n[12/12] Testing Job Cancellation...');
  const cancelTestBook = await BookService.createBook({
    prompt: 'Space rockets and aliens',
    ageGroup: 'kids',
    pageCount: 4,
  });
  await BookService.planBook(cancelTestBook.id);
  await BookGenerationService.startBookGeneration(cancelTestBook.id);
  const cancelSuccess = await BookGenerationService.cancelBookGeneration(cancelTestBook.id);
  assert(cancelSuccess === true, 'Cancellation triggered successfully');

  const cancelledBook = await BookService.getBookById(cancelTestBook.id);
  assert(cancelledBook?.status === 'cancelled', `Book status successfully updated to cancelled (${cancelledBook?.status})`);

  console.log('\n======================================================');
  console.log(`  ALL ${passedTests} OF ${totalTests} TESTS PASSED CLEANLY! ✓`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
