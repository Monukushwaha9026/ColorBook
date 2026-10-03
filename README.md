# ColorBook AI 🎨✨

> **Turn your ideas into printable AI coloring books.**  
> ColorBook AI transforms user prompts into unique, print-ready black-and-white coloring pages with Gemini AI storylines and local/cloud line art generation.

---

## 1. What ColorBook AI Does

ColorBook AI enables parents, educators, and creative users to create customized coloring books:
- **Idea Input**: Enter any creative description (e.g., *"A friendly dinosaur exploring a prehistoric jungle"*).
- **Target Age Groups**: Tailors linework density and complexity across 4 age brackets (`kids`, `children`, `teens`, `teen_plus`).
- **Flexible Page Count**: Generates 1 to 10 distinct, sequential coloring pages.
- **Optional Reference**: Accepts uploaded image references (JPEG, PNG, WebP) to guide scene generation.
- **AI Storyline & Page Concepts**: Google Gemini generates cohesive titles, narrative concepts, and line art prompts for each page.
- **Real Image Generation**: Integrates with local Stable Diffusion WebUI or cloud Hugging Face inference.
- **Quality & Safety Validation**: Every generated image is verified for format, dimensions ($768 \times 1024$), and line art contrast.
- **Interactive Review**: Preview full pages, inspect high-res modal views, regenerate individual pages with fresh variations, or delete and renumber pages sequentially.
- **Printable PDF Export**: Turn generated pages into crisp, print-ready coloring book PDFs with customizable paper size (A4 / US Letter) and orientation (Portrait / Landscape).
- **My Books Library**: Saved books are automatically listed in a gallery with cover thumbnails, generation/PDF statuses, direct re-downloading, and deletion.
- **Reopening & Invalidation**: Open any existing book to continue editing or regenerating pages. Edits automatically invalidate outdated PDFs with clear warnings and 1-click recompilation.
- **Security & Safety**: Path traversal immunity, ID sanitization, safe file storage, and lightweight in-memory rate limiting.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express, TypeScript, Zod validation
- **Database**: PostgreSQL with Prisma ORM (with automatic in-memory fallback for local testing without DB)
- **AI Book Planner**: Google Gemini 2.5 Flash Lite (`@google/genai` official SDK)
- **Image Generation Providers**:
  - `LocalImageProvider`: AUTOMATIC1111 / SD.Next / Fooocus `/sdapi/v1/txt2img` protocol
  - `HuggingFaceImageProvider`: Hugging Face Router Inference API
  - `TestImageProvider`: Fast, deterministic synthetic line art fallback reserved strictly for automated CI/tests
- **PDF Generation**: PDFKit with precise margins, containment scaling, and clean printable borders
- **Storage**: Local filesystem storage with Express static serving (`/storage/images/...`, `/storage/pdfs/...`, `/storage/references/...`)

---

## 3. Installation

Ensure you have Node.js (v18+) and npm installed.

```bash
# Clone the repository
git clone https://github.com/your-username/colorbook-ai.git
cd colorbook-ai

# Install root, client, and server dependencies
npm install
npm --prefix client install
npm --prefix server install

# Generate Prisma client
npm --prefix server run prisma:generate
```

---

## 4. How to Configure Gemini

ColorBook AI uses Google Gemini to plan book themes, narrative progression, and detailed visual prompts for each page.

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. In your `.env` file (copied from `.env.example`), set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_TEXT_MODEL=gemini-2.5-flash-lite
```

> **Security Note**: `GEMINI_API_KEY` is strictly maintained on the backend and is never exposed to the client or browser network responses.

---

## 5. How to Configure Image Generation

Configure the `IMAGE_PROVIDER` variable in `.env`:

### Option A: 100% Free Local AI Generation (Recommended)
Run Stable Diffusion locally using AUTOMATIC1111, SD.Next, or Fooocus with the API enabled:
```bash
./webui.bat --api --port 7860
```
In `.env`:
```env
IMAGE_PROVIDER=local
LOCAL_IMAGE_API_URL=http://localhost:7860
```

### Option B: Hugging Face Cloud Inference
In `.env`:
```env
IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_your_api_key_here
HUGGINGFACE_MODEL=black-forest-labs/FLUX.1-schnell
```

### Option C: Automated Testing / Development Fallback
For running automated test suites or local development without an active GPU:
```env
IMAGE_PROVIDER=test
```

---

## 6. How to Run Frontend and Backend

### Run Both Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### Or Run Individually

```bash
# Backend server (port 5000)
npm --prefix server run dev

# Frontend Vite dev server (port 5173)
npm --prefix client run dev
```

---

## 7. How to Run Tests

### Run All Test Suites
```bash
npm --prefix server run test:all
```

### Individual Test Suites
```bash
# Engine test suite (81 tests)
npm --prefix server run test:engine

# PDF generation and layout suite (43 tests)
npm --prefix server run test:pdf

# Phase 3 My Books, Invalidation, & Security suite (40 tests)
npm --prefix server run test:phase3

# End-to-End full flow verification
npx --prefix server tsx test-e2e-pdf.ts
```

---

## 8. Complete MVP Workflow

```text
1. User enters coloring-book idea
   ↓
2. Selects age group (kids, children, teens, teen_plus)
   ↓
3. Selects page count (1 to 10 pages)
   ↓
4. Optionally uploads reference image (JPEG, PNG, WebP)
   ↓
5. Gemini plans unique page concepts & age-specific visual prompts
   ↓
6. Image provider generates coloring pages (local SD or cloud)
   ↓
7. ImageValidator checks dimensions, format, contrast & linework
   ↓
8. Interactive review grid displays artwork
   ↓
9. User can regenerate individual pages or delete unwanted pages
   ↓
10. User selects paper size (A4 / US Letter) and orientation (Portrait / Landscape)
   ↓
11. PDFKit generates print-ready PDF with containment scaling & borders
   ↓
12. User downloads printable PDF coloring book
   ↓
13. Book is stored in 'My Books' with cover thumbnail and statuses
   ↓
14. User can reopen the book at any time to edit, regenerate, or re-download
   ↓
15. If pages are edited, the PDF is marked stale to prevent outdated downloads until recompiled
```

---

## 9. Architecture & Security Guarantees

- **No Stale PDFs**: Any modification to a book's pages (regeneration, deletion, reordering) marks `pdfStatus: 'stale'`. Downloads of stale PDFs return HTTP 409 `PDF_STALE`, and the UI prompts the user to recompile.
- **Directory Traversal Immunity**: All file endpoints and storage operations strictly validate IDs (`/^[a-zA-Z0-9_-]+$/`) and assert resolved canonical paths remain within designated storage root directories.
- **In-Memory Rate Limiting**: Expensive endpoints (`POST /api/books`, `POST /api/books/:id/generate`, `POST /api/books/:id/pages/:page/regenerate`, `POST /api/books/:id/pdf`) are protected against abuse with automated HTTP 429 throttling and `Retry-After` headers.
- **Disk Cleanup on Deletion**: Deleting a book atomically cleans up references, page image directories, and compiled PDF directories.

