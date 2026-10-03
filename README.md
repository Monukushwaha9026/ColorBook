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
- **Interactive Review**: Preview full pages, regenerate individual pages with fresh variations, or delete and renumber pages sequentially.

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
- **Storage**: Local filesystem storage with Express static serving (`/storage/images/...`)

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

Run the comprehensive engine test suite:

```bash
npm --prefix server run test:engine
```

This verifies:
- Prompt generation across all 4 age groups
- Content safety sanitization
- Book plan validation and JSON extraction
- TestImageProvider functionality
- Image quality and format validation
- 3-attempt validation retry loop
- Offline provider failure handling (no silent synthetic art fallbacks)
- Hugging Face adapter and missing key diagnostics
- Provider configuration validation
- Local image storage (save, retrieve, delete)
- Book creation and background generation orchestration
- Single-page regeneration preserving untouched pages
- Page deletion and sequential renumbering
- Job cancellation

To verify real image generation with a local or mock Stable Diffusion instance:
```bash
npx --prefix server tsx test-real-image.ts
```

---

## 8. Current MVP Workflow

```text
User enters coloring-book idea
  ↓
Selects age group (kids, children, teens, teen_plus)
  ↓
Selects page count (1 to 10 pages)
  ↓
Optionally uploads reference image (JPEG, PNG, WebP)
  ↓
Gemini creates unique page concepts & visual prompts
  ↓
Image provider generates coloring pages (local SD or cloud)
  ↓
ImageValidator checks dimensions, format & quality
  ↓
Pages appear in interactive preview grid
  ↓
User can regenerate an individual page
  ↓
User can delete a page (remaining pages renumber sequentially)
  ↓
User reviews the book
  ↓
[Step 2 will generate the downloadable PDF]
```

---

## 9. Known Limitations

- **PDF Generation**: Reserved for Step 2. The PDF settings UI is present in review mode, but actual multi-page PDF rendering is scheduled for the next development phase.
- **User Accounts & Payments**: Authentication, multi-user teams, billing, and payments are intentionally out of scope for the current MVP.
- **Hugging Face Serverless**: Hugging Face has deprecated FLUX.1 models on free serverless inference (`provider: hf-inference`); dedicated endpoints or local Stable Diffusion are recommended for real generation.
