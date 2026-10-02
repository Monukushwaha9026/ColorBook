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

## 🗄️ Backend API Endpoints

- `GET /api/health`: Health status & version check
- `GET /api/books`: List all books
- `GET /api/books/:id`: Get a specific book with its pages
- `POST /api/books`: Create a new book record (`planning` status)
- `POST /api/books/:id/plan`: **Trigger Gemini AI Book Planner** to generate structured storyline, page concepts, and line art visual prompts
- `POST /api/books/:id/pages`: Save or update pages
- `DELETE /api/books/:id`: Delete a book
- `POST /api/books/:bookId/pages/:pageNumber/regenerate`: Regenerate an individual page concept

---

## 🧪 Testing

To run the automated Step 3 verification suite:
```bash
npx tsx server/test-step3.ts
```
Covers:
- Prompt sanitization & injection protection
- JSON extraction & markdown fence handling
- Exact page count enforcement (both undersized and oversized conformance)
- Sequential page numbering ($1$ to $N$)
- Age-group difficulty mapping
- Missing API key error response (`AI_CONFIGURATION_ERROR`)
- End-to-end book planning flow

---

## 🔮 Next Step (Step 4 Preview)

- Connect real black-and-white image generation using Gemini / Imagen / FLUX line art models
- Generate actual coloring line art using the engineered `visualPrompt` from Step 3
- Cloud image storage (S3 / Cloudinary)
- Print-ready PDF compilation (PDFKit / Puppeteer)

