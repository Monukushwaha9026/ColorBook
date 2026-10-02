import React, { useState } from 'react';
import { Hero } from '../components/Hero';
import { StepIndicator } from '../components/StepIndicator';
import { PromptInput } from '../components/PromptInput';
import { AgeGroupSelector } from '../components/AgeGroupSelector';
import { PageCountSelector } from '../components/PageCountSelector';
import { ReferenceUploader } from '../components/ReferenceUploader';
import { GenerateButton } from '../components/GenerateButton';
import { GenerationProgress } from '../components/GenerationProgress';
import { BookPreviewGrid } from '../components/BookPreviewGrid';
import { PDFSettings } from '../components/PDFSettings';
import { PDFSuccessCard } from '../components/PDFSuccessCard';
import { api, ApiClientError } from '../lib/api';
import { generateMockBookPages } from '../lib/mockPlanner';
import { AlertCircle } from 'lucide-react';
import type {
  AgeGroupId,
  ColoringPageItem,
  PaperSize,
  Orientation,
  CreationStep,
  GenerationPhase,
  Book,
} from '../types';

interface CreatePageProps {
  initialPrompt?: string;
  onSaveBook?: (book: Book) => void;
}

export const CreatePage: React.FC<CreatePageProps> = ({
  initialPrompt = '',
  onSaveBook,
}) => {
  // Form State
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [ageGroup, setAgeGroup] = useState<AgeGroupId>('children');
  const [pageCount, setPageCount] = useState<number>(8);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Validation & Error State
  const [promptError, setPromptError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Workflow State
  const [currentStep, setCurrentStep] = useState<CreationStep>(1);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [simulatedCurrentPage, setSimulatedCurrentPage] = useState<number>(1);
  const [isPlanningDone, setIsPlanningDone] = useState<boolean>(false);
  const [createdBookId, setCreatedBookId] = useState<string>('');

  // Generated Pages State
  const [generatedPages, setGeneratedPages] = useState<ColoringPageItem[]>([]);

  // PDF Settings State
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('PORTRAIT');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Handle prompt change with live validation clearing
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    if (promptError && value.trim().length > 0) {
      setPromptError(null);
    }
    if (backendError) {
      setBackendError(null);
    }
  };

  // Start Generation Flow: Frontend validation -> Backend API call -> Mock Generation
  const handleStartGeneration = async () => {
    const trimmedPrompt = prompt.trim();

    // 1. Frontend validation: Prompt is required
    if (!trimmedPrompt) {
      setPromptError("Please describe what you'd like in your coloring book.");
      return;
    }
    setPromptError(null);
    setBackendError(null);
    setIsSubmitting(true);

    try {
      // 2. Call backend API to create book record with status 'planning'
      const response = await api.createBook({
        prompt: trimmedPrompt,
        ageGroup,
        pageCount,
        referenceImage,
        paperSize,
        orientation,
      });

      const bookId = response.book.id;
      setCreatedBookId(bookId);
      setIsSubmitting(false);

      // 3. Move UI into generation state
      setCurrentStep(2);
      setGenerationPhase('generating');
      setIsPlanningDone(false);
      setSimulatedCurrentPage(1);

      // 4. Generate mock page concepts matching prompt and exact selected pageCount
      const plannedPages = generateMockBookPages(trimmedPrompt, pageCount, bookId);

      // 5. Realistic simulated multi-stage timeline
      setTimeout(() => {
        setIsPlanningDone(true);

        let current = 1;
        const interval = setInterval(() => {
          current += 1;
          setSimulatedCurrentPage(Math.min(current, pageCount));

          if (current >= pageCount) {
            clearInterval(interval);
            setTimeout(() => {
              setGeneratedPages(plannedPages);
              setGenerationPhase('completed');
              setCurrentStep(3);

              // Persist generated pages to backend
              api.saveBookPages(bookId, plannedPages).catch(() => {
                // Non-blocking in-memory sync
              });
            }, 500);
          }
        }, 350);
      }, 850);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiClientError) {
        if (err.code === 'INVALID_PROMPT') {
          setPromptError(err.message);
        } else {
          setBackendError(err.message);
        }
      } else {
        setBackendError('Could not create your book. Please check your connection and try again.');
      }
    }
  };

  // Instant skip for quick demo/testing
  const handleSkipGeneration = () => {
    const plannedPages = generateMockBookPages(prompt.trim() || 'Coloring Book', pageCount, createdBookId || 'book_fast');
    setGeneratedPages(plannedPages);
    setGenerationPhase('completed');
    setCurrentStep(3);
    if (createdBookId) {
      api.saveBookPages(createdBookId, plannedPages).catch(() => {});
    }
  };

  // Regenerate an individual page (only that page changes)
  const handleRegeneratePage = async (pageNumber: number) => {
    // Set loading state on that card only
    setGeneratedPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, isRegenerating: true } : p
      )
    );

    try {
      // Call backend API regeneration endpoint
      const res = await api.regeneratePage(createdBookId || 'current_book', pageNumber);

      setGeneratedPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                concept: res.page.concept,
                title: res.page.concept,
                imageUrl: res.page.imageUrl,
                isRegenerating: false,
              }
            : p
        )
      );
    } catch {
      // Graceful fallback to client-side rotation
      setTimeout(() => {
        setGeneratedPages((prev) =>
          prev.map((p) =>
            p.pageNumber === pageNumber
              ? {
                  ...p,
                  concept: `${p.concept} (Alternative)`,
                  title: `${p.title} (Alternative)`,
                  imageUrl: '/illustrations/coloring-spaceship.svg',
                  isRegenerating: false,
                }
              : p
          )
        );
      }, 600);
    }
  };

  // Delete a page and visually renumber remaining pages
  const handleDeletePage = (pageNumber: number) => {
    if (generatedPages.length <= 1) return;

    setGeneratedPages((prev) => {
      const filtered = prev.filter((p) => p.pageNumber !== pageNumber);
      return filtered.map((p, index) => ({
        ...p,
        pageNumber: index + 1,
      }));
    });

    // Show subtle feedback message
    setNotificationMessage(`Page ${pageNumber} deleted. Remaining pages renumbered.`);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 3200);
  };

  // Add an extra page up to 10
  const handleAddPage = () => {
    if (generatedPages.length >= 10) return;
    const newPageNum = generatedPages.length + 1;
    const additionalPages = generateMockBookPages(prompt.trim() || 'Coloring Book', 10, createdBookId || 'current_book');
    const template = additionalPages[(newPageNum - 1) % additionalPages.length];

    const newPage: ColoringPageItem = {
      ...template,
      id: `page_${createdBookId || 'cur'}_${newPageNum}_${Date.now()}`,
      pageNumber: newPageNum,
    };
    setGeneratedPages((prev) => [...prev, newPage]);
  };

  // Trigger Mock PDF Generation
  const handleCreatePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      setIsGeneratingPDF(false);
      setPdfSuccess(true);
      setCurrentStep(4);

      // Save to My Books if callback provided
      if (onSaveBook) {
        const newBook: Book = {
          id: createdBookId || `book_${Date.now()}`,
          title: prompt.slice(0, 36) || 'Custom Coloring Book',
          prompt,
          ageGroup,
          pageCount: generatedPages.length,
          status: 'completed',
          pages: generatedPages,
          paperSize,
          orientation,
          referenceImage,
          createdAt: new Date().toISOString(),
          coverImage: generatedPages[0]?.imageUrl || '/illustrations/coloring-rocket.png',
        };
        onSaveBook(newBook);
      }
    }, 1200);
  };

  // Reset to create another book
  const handleReset = () => {
    setCurrentStep(1);
    setGenerationPhase('idle');
    setPdfSuccess(false);
    setGeneratedPages([]);
    setPromptError(null);
    setBackendError(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* 1. Hero Header */}
      <Hero />

      {/* 2. Step Indicator */}
      <div className="mb-6">
        <StepIndicator
          currentStep={currentStep}
          onStepClick={(step) => {
            if (step === 1) setCurrentStep(1);
            else if (step === 3 && generatedPages.length > 0) setCurrentStep(3);
            else if (step === 4 && pdfSuccess) setCurrentStep(4);
          }}
          canNavigateToStep={(step) => {
            if (step === 1) return true;
            if (step === 2) return generationPhase === 'generating';
            if (step === 3) return generatedPages.length > 0;
            if (step === 4) return pdfSuccess;
            return false;
          }}
        />
      </div>

      {/* Backend / Global Error Banner */}
      {backendError && (
        <div
          role="alert"
          className="mb-6 max-w-xl mx-auto flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Could not create your book</p>
            <p className="text-xs text-rose-700 mt-0.5">{backendError}</p>
          </div>
          <button
            type="button"
            onClick={() => setBackendError(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Creation Workspace (Two-column layout on desktop, stacked on mobile) */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft p-5 sm:p-8 lg:p-10 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Left Column: Describe your coloring book */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Describe your coloring book
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set the theme, subjects, and style for your personalized book.
                </p>
              </div>

              {/* Prompt Input with inline validation */}
              <PromptInput
                prompt={prompt}
                onChange={handlePromptChange}
                error={promptError}
                disabled={isSubmitting}
                maxLength={500}
              />

              {/* Reference Image Upload (Optional) */}
              <div className="pt-2 border-t border-slate-100">
                <ReferenceUploader
                  imagePreview={referenceImage}
                  onImageChange={setReferenceImage}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Right Column: Choose your options */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6 lg:border-l lg:border-slate-100 lg:pl-10">
              <div className="flex flex-col gap-6">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Choose your options
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize your audience age group and page quantity.
                  </p>
                </div>

                {/* Age Group Selector */}
                <AgeGroupSelector
                  selectedAgeGroup={ageGroup}
                  onSelect={setAgeGroup}
                  disabled={isSubmitting}
                />

                {/* Page Count Selector (1-10) */}
                <PageCountSelector
                  pageCount={pageCount}
                  onSelect={setPageCount}
                  disabled={isSubmitting}
                />
              </div>

              {/* Generate Button Container */}
              <div className="pt-4 border-t border-slate-100">
                <GenerateButton
                  pageCount={pageCount}
                  onClick={handleStartGeneration}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Generation Progress State */}
      {currentStep === 2 && (
        <GenerationProgress
          currentPage={simulatedCurrentPage}
          totalPages={pageCount}
          isPlanningDone={isPlanningDone}
          onSkip={handleSkipGeneration}
        />
      )}

      {/* 5. Review Generated Pages & PDF Setup */}
      {currentStep >= 3 && !pdfSuccess && (
        <div className="flex flex-col gap-10">
          <BookPreviewGrid
            pages={generatedPages}
            onRegeneratePage={handleRegeneratePage}
            onDeletePage={handleDeletePage}
            onAddPage={handleAddPage}
            notificationMessage={notificationMessage}
          />

          <PDFSettings
            paperSize={paperSize}
            orientation={orientation}
            pageCount={generatedPages.length}
            onPaperSizeChange={setPaperSize}
            onOrientationChange={setOrientation}
            onCreatePDF={handleCreatePDF}
            isGeneratingPDF={isGeneratingPDF}
          />
        </div>
      )}

      {/* 6. PDF Success Card */}
      {pdfSuccess && (
        <div className="flex flex-col gap-8">
          <PDFSuccessCard
            pageCount={generatedPages.length}
            paperSize={paperSize}
            orientation={orientation}
            bookTitle={prompt.slice(0, 32)}
            onDownloadPDF={() => {
              alert(`Downloading printable PDF for "${prompt.slice(0, 24) || 'ColorBook'}" (${generatedPages.length} pages, ${paperSize})`);
            }}
            onDownloadZIP={() => {
              alert(`Downloading ZIP bundle: "${generatedPages.length} black-and-white coloring pages (PNG archive)"`);
            }}
            onReset={handleReset}
          />

          {/* Review generated pages below the success card */}
          <div className="pt-6 border-t border-slate-200">
            <BookPreviewGrid
              pages={generatedPages}
              onRegeneratePage={handleRegeneratePage}
              onDeletePage={handleDeletePage}
              onAddPage={handleAddPage}
              notificationMessage={notificationMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};
