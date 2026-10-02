import { BookPlanValidator } from './src/services/ai/book-plan-validator.js';
import { GeminiService } from './src/services/ai/gemini.service.js';
import { BookPlannerService } from './src/services/ai/book-planner.service.js';
import { BookService } from './src/services/book.service.js';
import type { AIProvider, BookPlan, BookPlanInput } from './src/services/ai/ai-provider.interface.js';
import { AppError } from './src/middleware/errorHandler.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- Running Step 3 Test Suite ---\n');

  // 1. Prompt Sanitization
  const rawPrompt = '  Space Adventure with Alien Pets!\x00\x08  ';
  const cleanPrompt = BookPlanValidator.sanitizePrompt(rawPrompt);
  assert(cleanPrompt === 'Space Adventure with Alien Pets!', 'Sanitizes whitespace and control characters');

  // 2. Markdown Fence Stripping & JSON Extraction
  const fencedJson = '```json\n{"title": "Test Book", "theme": "Test", "pages": []}\n```';
  const extracted: any = BookPlanValidator.extractJsonFromText(fencedJson);
  assert(extracted.title === 'Test Book', 'Extracts valid JSON from markdown code fences');

  // 3. Exact Page Count Enforcement (Undersized -> Padded)
  const undersizedPlan = {
    title: 'Dino World',
    theme: 'dinosaurs',
    styleDirection: 'Simple bold lines',
    pages: [
      { pageNumber: 1, title: 'T-Rex', concept: 'Friendly T-Rex smiling', visualPrompt: 'line art', difficulty: 'easy' },
    ],
  };
  const paddedPlan = BookPlanValidator.validateAndConformPlan(undersizedPlan, {
    prompt: 'Dinosaurs',
    ageGroup: 'kids',
    pageCount: 5,
  });
  assert(paddedPlan.pages.length === 5, 'Pads undersized plan to exact pageCount (5 pages)');
  assert(paddedPlan.pages[4].pageNumber === 5, 'Page numbering is strictly sequential 1 to 5');
  assert(paddedPlan.pages[0].difficulty === 'easy', 'Kids difficulty is easy');

  // 4. Exact Page Count Enforcement (Oversized -> Sliced)
  const oversizedPlan = {
    title: 'Space Odyssey',
    theme: 'space',
    pages: [
      { pageNumber: 1, title: 'P1', concept: 'C1', visualPrompt: 'VP1', difficulty: 'medium' },
      { pageNumber: 2, title: 'P2', concept: 'C2', visualPrompt: 'VP2', difficulty: 'medium' },
      { pageNumber: 3, title: 'P3', concept: 'C3', visualPrompt: 'VP3', difficulty: 'medium' },
      { pageNumber: 4, title: 'P4', concept: 'C4', visualPrompt: 'VP4', difficulty: 'medium' },
    ],
  };
  const slicedPlan = BookPlanValidator.validateAndConformPlan(oversizedPlan, {
    prompt: 'Space',
    ageGroup: 'children',
    pageCount: 2,
  });
  assert(slicedPlan.pages.length === 2, 'Truncates oversized plan to exact pageCount (2 pages)');
  assert(slicedPlan.pages[1].pageNumber === 2, 'Page numbering remains sequential 1 to 2');

  // 5. Age Group Difficulty Conformance
  const teenPlan = BookPlanValidator.validateAndConformPlan({
    title: 'Cyberpunk City',
    theme: 'cyberpunk',
    pages: [{ pageNumber: 1, title: 'Skyline', concept: 'Futuristic city', visualPrompt: 'detailed lines', difficulty: 'invalid_diff' }],
  }, {
    prompt: 'Cyberpunk',
    ageGroup: 'teen_plus',
    pageCount: 1,
  });
  assert(teenPlan.pages[0].difficulty === 'detailed', 'teen_plus defaults to detailed/intricate when difficulty is missing or invalid');

  // 6. GeminiService Missing API Key Error
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  const geminiService = new GeminiService();
  try {
    await geminiService.generateBookPlan({
      prompt: 'Ocean animals',
      ageGroup: 'children',
      pageCount: 3,
    });
    assert(false, 'Should throw error when GEMINI_API_KEY is missing');
  } catch (err: any) {
    assert(err instanceof AppError, 'Throws AppError');
    assert(err.code === 'AI_CONFIGURATION_ERROR', 'Error code is AI_CONFIGURATION_ERROR');
    assert(err.message === 'Gemini API is not configured.', 'Error message is "Gemini API is not configured."');
  }
  process.env.GEMINI_API_KEY = savedKey;

  // 7. Mock AIProvider injection into BookPlannerService & BookService
  class MockValidProvider implements AIProvider {
    async generateBookPlan(input: BookPlanInput): Promise<BookPlan> {
      const pages = [];
      for (let i = 1; i <= input.pageCount; i++) {
        pages.push({
          pageNumber: i,
          title: `Scene ${i}: Magical Journey`,
          concept: `A unique coloring adventure scene #${i} featuring ${input.prompt}.`,
          visualPrompt: `coloring book line art, pure black lines on crisp white background, ${input.prompt} scene ${i}, enclosed outlines`,
          difficulty: 'medium' as const,
        });
      }
      return {
        title: `Magical ${input.prompt}`,
        theme: input.prompt,
        styleDirection: "Children's coloring book line art",
        pages,
      };
    }
  }

  BookPlannerService.setProvider(new MockValidProvider());

  // 8. Test BookService.createBook and BookService.planBook end-to-end
  const createdBook = await BookService.createBook({
    prompt: 'Enchanted Forest and Woodland Friends',
    ageGroup: 'children',
    pageCount: 6,
  });
  assert(createdBook.status === 'planning', 'Newly created book has status "planning"');

  const planned = await BookService.planBook(createdBook.id);
  assert(planned.book.title === 'Magical Enchanted Forest and Woodland Friends', 'Book title is updated with AI plan');
  assert(planned.book.status === 'generating', 'Book status updated to "generating" after planning');
  assert(planned.pages.length === 6, 'Generated exact page count of 6 pages');
  assert(planned.pages[0].status === 'planned', 'Pages have status "planned"');
  assert(planned.pages[0].visualPrompt?.includes('coloring book line art') === true, 'Page has rich visualPrompt for future line art');

  // Restore real Gemini provider
  BookPlannerService.setProvider(new GeminiService());

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
