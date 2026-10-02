# ColorBook AI 🎨✨

> **Turn your ideas into printable coloring books.**  
> Create unique black-and-white coloring pages with AI, review them, and download your finished book as a PDF.

---

## 📖 Overview

ColorBook AI is a modern web application designed for parents, teachers, children, teens, and creative enthusiasts to generate customized, print-ready black-and-white coloring books from textual ideas and optional style references.

This repository represents **Step 1: Project Foundation + UI System**, delivering:
- A production-quality design system with pastel tones, purple brand accents, soft cards, and responsive layouts
- A 4-step creation workflow: **Describe ➔ Generate ➔ Review ➔ Download**
- Realistic mock generation pipeline with animated progress and page-by-page creation
- Pure black-and-white printable line art illustration system (10 distinct master vector/raster templates)
- PDF configuration options (A4 vs. US Letter, Portrait vs. Landscape) and celebratory download state
- Curated Examples gallery with theme presets and prompt loading
- "My Books" library with empty state illustration and book management
- Full-stack architectural foundation: React (Vite + Tailwind CSS v4) + Express API + PostgreSQL Prisma schema

---

## 🏗️ Architecture & Project Structure

```text
colorbook-ai/
├── client/                     # Frontend Application (React 19 + Vite + Tailwind v4 + TypeScript)
│   ├── public/
│   │   └── illustrations/      # High-res extracted assets & pure B&W line art SVGs
│   ├── src/
│   │   ├── components/         # Modular, reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── PromptInput.tsx
│   │   │   ├── SuggestionChip.tsx
│   │   │   ├── AgeGroupSelector.tsx
│   │   │   ├── PageCountSelector.tsx
│   │   │   ├── ReferenceUploader.tsx
│   │   │   ├── GenerateButton.tsx
│   │   │   ├── GenerationProgress.tsx
│   │   │   ├── BookPreviewGrid.tsx
│   │   │   ├── ColoringPageCard.tsx
│   │   │   ├── PageModal.tsx
│   │   │   ├── PDFSettings.tsx
│   │   │   ├── PDFSuccessCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ThemeCard.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── CreatePage.tsx      # Main coloring book creation workflow
│   │   │   ├── ExamplesPage.tsx    # Themes gallery & sample coloring pages
│   │   │   └── MyBooksPage.tsx     # Saved books with empty & populated views
│   │   ├── data/
│   │   │   └── mockData.ts         # Age groups, prompt chips, theme categories & master pages
│   │   ├── types/
│   │   │   └── index.ts            # Type definitions for books, pages, and creation states
│   │   ├── App.tsx                 # Root application container & navigation
│   │   ├── main.tsx
│   │   └── index.css               # Tailwind CSS v4 configuration and SF Pro font stack
│   ├── vite.config.ts
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express + TypeScript + Zod)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── book.controller.ts
│   │   │   └── page.controller.ts
│   │   ├── routes/
│   │   │   ├── book.routes.ts
│   │   │   ├── page.routes.ts
│   │   │   └── health.routes.ts
│   │   ├── services/
│   │   │   ├── book.service.ts     # Data service with Prisma + in-memory fallback
│   │   │   └── page.service.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── validate.ts         # Zod schema validation
│   │   ├── lib/
│   │   │   └── prisma.ts           # Prisma client singleton
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts                # Express application entry point
│   ├── tsconfig.json
│   └── package.json
│
├── prisma/
│   └── schema.prisma           # PostgreSQL schema (User, Book, Page models)
│
├── .env.example
├── .env
├── package.json                # Root package with concurrently scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on v24.18.0)
- **npm**: v9+ (tested on v11.16.0)

### 1. Installation
Install dependencies across root, server, and client:

```bash
# In the project root (colorbook-ai)
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Generate Prisma Client
```bash
npm --prefix server run prisma:generate
```

### 3. Run Development Servers
You can start both client and server concurrently with one command:

```bash
npm run dev
```

Or run them individually:

```bash
# Terminal 1: Backend Express API (port 5000)
npm run dev:server

# Terminal 2: Frontend Vite App (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Visual System & Coloring Page Standards

- **Application Shell**: Light, modern, friendly pastel palette with primary purple accents (`#7C3AED` / `#9333EA`), generous whitespace, rounded cards (`rounded-2xl` / `rounded-3xl`), and subtle elevation shadows.
- **Coloring Pages**: Strictly compliant with print guidelines:
  - Pure white background (`#FFFFFF`)
  - Crisp black line art outlines (`#1F2937` / `#111827`)
  - Zero grayscale, zero color fills, zero gradients
  - Sharp vector SVGs and high-resolution line art suitable for standard home/office printing

---

## 🔄 Mock Workflow & Interactions

1. **Describe (Step 1)**:
   - Type custom ideas into the comfortable, rounded textarea with live character counter.
   - Click any suggested prompt chip (Space Adventure, Dinosaurs, Animals, etc.) or "Surprise me" to populate rich prompts.
   - Drag and drop or upload an optional reference image with preview and removal.
   - Select target audience from 4 age groups (Kids 3–6, Children 7–10, Teens 11–13, Teen+ 14–17).
   - Choose page count (1 to 10 pages, default 8).
2. **Generate (Step 2)**:
   - Click "Generate Coloring Book →".
   - Experience the simulated multi-stage pipeline: "Planning your pages ✓" ➔ "Creating page X of Y" with animated progress bar.
   - Fast-forward skip available for quick testing.
3. **Review (Step 3)**:
   - Review generated pages in a 4-column responsive grid.
   - Click "Regenerate" on any card to redraw that single page with spinning mock state and fresh line art variation.
   - Click the trash icon to delete a page (automatically re-indexes numbering).
   - Click "Preview" to open the high-res inspection lightbox with zoom and direct page printing.
   - Add extra pages up to 10.
4. **Download (Step 4)**:
   - Choose paper size (A4 vs. US Letter) and orientation (Portrait vs. Landscape).
   - Click "Create PDF →" to trigger mock compilation.
   - Celebratory PDF success card with confetti, summary badges, and download triggers.
   - Automatically saves the book into the "My Books" library.

---

## 🤖 Step 3: Free-Tier AI Book Planner (Google Gemini 2.5 Flash Lite)

ColorBook AI connects to Google's official Gen AI SDK (`@google/genai`) to dynamically generate structured coloring book plans:

- **Free-Tier Model**: `gemini-2.5-flash-lite`
- **Backend-Only Security**: `GEMINI_API_KEY` is loaded and executed strictly on the server and is never exposed to the client or browser bundle.
- **Exact Page Count Enforcement**: Generates exactly the requested number of pages ($1$ to $10$).
- **Structured Storylines**: Generates unified titles, themes, style directions, unique scenes per page, and age-calibrated line art prompts.
- **Age Complexity Calibration**:
  - `kids` (3–6): Bold, thick outlines, simple shapes, `easy` difficulty.
  - `children` (7–10): Clean outlines, playful scenes, `easy` or `medium` difficulty.
  - `teens` (11–13): Expressive linework, layered composition, `medium` or `detailed` difficulty.
  - `teen_plus` (14–17): Intricate line art, decorative patterns, `detailed` or `intricate` difficulty.
- **Line Art Visual Prompts**: Engineered visual prompts for black-and-white coloring pages (no colors, no shading, enclosed spaces).
- **Graceful Error Handling**: If `GEMINI_API_KEY` is missing or invalid, the backend returns:
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_CONFIGURATION_ERROR",
      "message": "Gemini API is not configured."
    }
  }
  ```
  The frontend gracefully detects this with an interactive modal and provides a 1-click "Preview with Sample AI Plan (Demo Mode)" option.

---

## 🔑 Setting Up Google Gemini API Key

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Open `.env` (or copy `.env.example` to `.env`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_TEXT_MODEL=gemini-2.5-flash-lite
   ```
3. Restart the server:
   ```bash
   npm run dev
   ```

---

## 🎨 AI Generation Engine (Step 1 Engine)

The complete AI Generation Engine converts user concepts into validated, printable black-and-white coloring pages:

```text
USER IDEA
   ↓
AI BOOK PLANNER (Gemini 2.5 Flash-Lite)
   ↓
UNIQUE PAGE CONCEPTS & VISUAL PROMPTS
   ↓
IMAGE PROVIDER (Local SD WebUI or Free Provider)
   ↓
IMAGE QUALITY & SAFETY VALIDATOR
   ↓
LOCAL IMAGE STORAGE (storage/images/books/{id}/page-{num}.png)
   ↓
FRONTEND PREVIEW & INDIVIDUAL REGENERATION
```

### 1. Replaceable Image Provider System
- **Local Provider (`IMAGE_PROVIDER=local`)**: Connects to local Stable Diffusion WebUI / SD.Next / Forge API (`http://localhost:7860/sdapi/v1/txt2img`). Returns a controlled error (`LOCAL_IMAGE_PROVIDER_UNAVAILABLE`) if the local server is offline without crashing the app.
- **Hugging Face Cloud Provider (`IMAGE_PROVIDER=huggingface`)**: Connects to Hugging Face Inference API (`black-forest-labs/FLUX.1-schnell` or custom `HUGGINGFACE_MODEL`). Returns controlled errors (`HUGGINGFACE_CONFIG_ERROR`, `HUGGINGFACE_AUTH_ERROR`) when credentials are missing or invalid. Note: free cloud usage is subject to provider rate limits.
- **Test Provider (`IMAGE_PROVIDER=test`)**: Deterministic synthetic line-art generator strictly for automated tests, CI, and architecture verification. Clearly marked as **TEST / DEVELOPMENT FALLBACK** and never presented as genuine AI generation.
- **No Silent Fallback**: If a real provider (`local` or `huggingface`) fails, the system marks the page as failed and prompts the user to retry—it never silently substitutes synthetic artwork.
- **Image Prompt Builder**: Injects age-calibrated linework rules (thick outlines for 3–6, medium for 7–10, fine for 11–13, intricate for 14–17), strict pure B&W technical constraints, negative cues, and family-friendly safety filtering.
- **Quality & Safety Validation**: Every generated image is verified for binary format integrity (PNG/JPEG/WebP/SVG), minimum dimensions (>= 512px), non-empty buffers, and clean linework before being accepted.
- **Automatic Retry Loop**: Up to 3 attempts with dynamic seeds and parameter variation before failing a page.

### 2. Storage System
- Saves generated coloring pages to `storage/images/books/{bookId}/page-{pageNumber}.png`.
- Serves static assets directly via Express at `/storage/images` and `/api/storage/images`.
- Provides automatic file cleanup when books or individual pages are deleted.

### 3. Orchestration & State Management
- **Background Worker**: `POST /api/books/:id/generate` responds immediately with `202 Accepted` while generation runs asynchronously in the background.
- **Controlled Concurrency**: Configurable worker pool (`IMAGE_GENERATION_CONCURRENCY=1`) prevents CPU/GPU starvation.
- **Live Polling**: Frontend polls `GET /api/books/:id` every 1.5 seconds with live stage checklists and page completion counts.
- **Independent Page Regeneration**: `POST /api/books/:id/pages/:pageNumber/regenerate` redraws only the targeted page with fresh variation cues while preserving all other completed pages.
- **Page Deletion & Renumbering**: `DELETE /api/books/:id/pages/:pageNumber` deletes the page and sequentially re-indexes remaining pages ($1, 2, 3...$).
- **Cancellation**: `POST /api/books/:id/cancel` immediately halts ongoing generation workers and updates the book status to `cancelled`.

---

## 🔑 Environment Configuration

Create or update `.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/colorbook_ai?schema=public"

# AI Book Planner (Gemini)
GEMINI_TEXT_MODEL=gemini-2.5-flash-lite
GEMINI_API_KEY=your_gemini_api_key_here

# Image Provider ('local' | 'huggingface' | 'test')
IMAGE_PROVIDER=local

# Local Stable Diffusion-compatible API
LOCAL_IMAGE_API_URL=http://localhost:7860

# Hugging Face Cloud Inference
HUGGINGFACE_API_KEY=
HUGGINGFACE_MODEL=black-forest-labs/FLUX.1-schnell

# Test provider (Deterministic synthetic fallback for CI/testing)
# IMAGE_PROVIDER=test

# Image Storage
IMAGE_STORAGE=local
LOCAL_IMAGE_STORAGE_PATH=./storage/images

# Concurrency & Retries
IMAGE_GENERATION_CONCURRENCY=1
MAX_IMAGE_GENERATION_ATTEMPTS=3
```

---

## 🗄️ Complete API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/books` | List all coloring books |
| `GET` | `/api/books/:id` | Get book details, pages, and generation progress |
| `POST` | `/api/books` | Create a new coloring book draft |
| `POST` | `/api/books/:id/plan` | Generate structured storyline & page concepts with Gemini |
| `POST` | `/api/books/:id/generate` | Start asynchronous background image generation engine |
| `POST` | `/api/books/:id/cancel` | Cancel ongoing background generation job |
| `POST` | `/api/books/:id/pages/:pageNumber/regenerate` | Individually regenerate a single page with variation |
| `DELETE` | `/api/books/:id/pages/:pageNumber` | Delete a single page and renumber remaining pages |
| `DELETE` | `/api/books/:id` | Delete entire book and clean up stored images |

---

## 🧪 Automated Test Suites

1. **Complete Engine & Architecture Test Matrix** (73 tests):
   ```bash
   npx tsx server/test-engine.ts
   ```

2. **Real Image Generation & SD Protocol Test**:
   ```bash
   npx tsx server/test-real-image.ts
## 🔮 Next Step (Step 2 Preview)

- Implement printable PDF generation (A4 and US Letter sizes, Portrait and Landscape orientations)
- Print-ready margins, cover page, and page borders
- Direct high-resolution PDF download in the frontend


