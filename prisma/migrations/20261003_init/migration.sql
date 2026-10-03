-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('kids', 'children', 'teens', 'teen_plus');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('draft', 'planning', 'generating', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('pending', 'planned', 'generating', 'completed', 'failed', 'deleted');

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "theme" TEXT,
    "styleDirection" TEXT,
    "prompt" TEXT NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL DEFAULT 'children',
    "pageCount" INTEGER NOT NULL DEFAULT 8,
    "referenceImageUrl" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'planning',
    "paperSize" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'PORTRAIT',
    "pdfUrl" TEXT,
    "pdfStatus" TEXT DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_pages" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "title" TEXT,
    "concept" TEXT NOT NULL,
    "visualPrompt" TEXT,
    "difficulty" TEXT,
    "imageUrl" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'planned',
    "generationAttempts" INTEGER NOT NULL DEFAULT 0,
    "validationScore" DOUBLE PRECISION,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "books_status_idx" ON "books"("status");

-- CreateIndex
CREATE INDEX "book_pages_bookId_idx" ON "book_pages"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "book_pages_bookId_pageNumber_key" ON "book_pages"("bookId", "pageNumber");

-- AddForeignKey
ALTER TABLE "book_pages" ADD CONSTRAINT "book_pages_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
