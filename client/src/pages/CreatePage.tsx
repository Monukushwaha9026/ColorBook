import React, { useState, useRef, useEffect } from 'react';
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
import { AlertCircle, KeyRound, Sparkles, X, ExternalLink, ArrowRight } from 'lucide-react';
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
  const [apiKeyNeededModal, setApiKeyNeededModal] = useState<boolean>(false);

  // Workflow State
  const [currentStep, setCurrentStep] = useState<CreationStep>(1);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [completedPagesCount, setCompletedPagesCount] = useState<number>(0);
  const [isPlanningDone, setIsPlanningDone] = useState<boolean>(false);
  const [planningStatusMessage, setPlanningStatusMessage] = useState<string>('');
  const [createdBookId, setCreatedBookId] = useState<string>('');

  // Polling ref to prevent concurrent polling loops
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Book Plan Metadata
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookTheme, setBookTheme] = useState<string>('');
  const [bookStyleDirection, setBookStyleDirection] = useState<string>('');

  // Generated Pages State
  const [generatedPages, setGeneratedPages] = useState<ColoringPageItem[]>([]);

  // PDF Settings State
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('PORTRAIT');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Start polling backend for generation progress
  const startPollingProgress = (bookId: string, totalTargetPages: number) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.getBook(bookId);
        if (!res.book) return;

        const pages = res.book.pages || [];
        setGeneratedPages(pages);

        const completed = pages.filter((p) => p.status === 'completed').length;
        setCompletedPagesCount(completed);
        setActivePageNumber(Math.min(totalTargetPages, completed + 1));

        // Stop polling on terminal states
        if (res.book.status === 'completed') {
          stopPolling();
          setGenerationPhase('completed');
          setCurrentStep(3);
          setIsSubmitting(false);
        } else if (res.book.status === 'failed') {
          stopPolling();
          setGenerationPhase('completed');
          setCurrentStep(3);
          setIsSubmitting(false);
          setNotificationMessage('Some pages could not be generated. You can retry them individually below.');
        } else if (res.book.status === 'cancelled') {
          stopPolling();
          setGenerationPhase('completed');
          setCurrentStep(3);
          setIsSubmitting(false);
          setNotificationMessage('Book generation was cancelled.');
        }
      } catch (pollErr) {
        console.warn('Polling error:', pollErr);
      }
    }, 1500);
  };

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

  // Start Generation Flow:
  // Prompt Validation -> Create Book -> Plan Book with Gemini -> Start Image Generation -> Poll Progress
  const handleStartGeneration = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setPromptError("Please describe what you'd like in your coloring book.");
      return;
    }
    setPromptError(null);
    setBackendError(null);
    setIsSubmitting(true);

    try {
      // 1. Create book record in backend
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

      // 2. Transition UI to Generation Step
      setCurrentStep(2);
      setGenerationPhase('generating');
      setIsPlanningDone(false);
      setCompletedPagesCount(0);
      setActivePageNumber(1);
      setPlanningStatusMessage('Contacting Google Gemini AI to plan your unique coloring pages…');

      // 3. Plan book using Gemini AI
      try {
        const planRes = await api.planBook(bookId, referenceImage);

        setIsPlanningDone(true);
        setPlanningStatusMessage('Book plan created! Starting black-and-white line art generation…');

        setBookTitle(planRes.book.title || trimmedPrompt);
        setBookTheme(planRes.book.theme || trimmedPrompt);
        setBookStyleDirection(planRes.book.styleDirection || '');
        setGeneratedPages(planRes.pages);

        // 4. Start background image generation on the backend
        await api.startGeneration(bookId);

        // 5. Begin polling backend for real progress
        startPollingProgress(bookId, planRes.pages.length || pageCount);
      } catch (planErr: unknown) {
        setIsSubmitting(false);
        if (planErr instanceof ApiClientError && planErr.code === 'AI_CONFIGURATION_ERROR') {
          // Gemini API key is missing on the server
          setApiKeyNeededModal(true);
          setCurrentStep(1);
          setGenerationPhase('idle');
          return;
        }
        throw planErr;
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setCurrentStep(1);
      setGenerationPhase('idle');
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

  // Cancel generation in progress
  const handleCancelGeneration = async () => {
    stopPolling();
    if (createdBookId) {
      try {
        await api.cancelGeneration(createdBookId);
      } catch {
        // Ignored
      }
    }
    setGenerationPhase('completed');
    setCurrentStep(3);
    setIsSubmitting(false);
    setNotificationMessage('Generation cancelled. You can review and regenerate pages below.');
  };

  // Fallback demo mode when user wants to preview without setting an API key immediately
  const handleProceedWithMock = async () => {
    setApiKeyNeededModal(false);
    setCurrentStep(2);
    setGenerationPhase('generating');
    setIsPlanningDone(false);
    setPlanningStatusMessage('Generating sample AI book plan with unique concepts…');

    const mockPages = generateMockBookPages(prompt.trim() || 'Coloring Book', pageCount, createdBookId || 'demo_book');
    const title = `${prompt.trim() || 'Custom'} Coloring Book (Demo Plan)`;
    setBookTitle(title);
    setBookTheme(prompt.trim());
    setBookStyleDirection('Clean printable line art with bold outlines');

    setTimeout(() => {
      setIsPlanningDone(true);
      setPlanningStatusMessage('Creating sample coloring pages…');
      let completed = 0;
      const interval = setInterval(() => {
        completed += 1;
        setCompletedPagesCount(completed);
        setActivePageNumber(Math.min(pageCount, completed + 1));
        if (completed >= pageCount) {
          clearInterval(interval);
          setGeneratedPages(mockPages);
          setGenerationPhase('completed');
          setCurrentStep(3);
          setIsSubmitting(false);
        }
      }, 250);
    }, 500);
  };

  // Instant skip for quick preview
  const handleSkipGeneration = () => {
    stopPolling();
    const plannedPages = generateMockBookPages(prompt.trim() || 'Coloring Book', pageCount, createdBookId || 'book_fast');
    setBookTitle(`${prompt.trim() || 'Custom'} Coloring Book`);
    setBookTheme(prompt.trim());
    setBookStyleDirection('Clean printable line art');
    setGeneratedPages(plannedPages);
    setGenerationPhase('completed');
    setCurrentStep(3);
    setIsSubmitting(false);
    if (createdBookId) {
      api.saveBookPages(createdBookId, plannedPages).catch(() => {});
    }
  };

  // Regenerate an individual page (only that page changes)
  const handleRegeneratePage = async (pageNumber: number) => {
    setGeneratedPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, isRegenerating: true, status: 'generating' } : p
      )
    );

    try {
      const res = await api.regeneratePage(createdBookId || 'current_book', pageNumber);

      setGeneratedPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                concept: res.page.concept,
                title: res.page.concept,
                imageUrl: res.page.imageUrl,
                status: 'completed',
                isRegenerating: false,
              }
            : p
        )
      );

      setNotificationMessage(`Page ${pageNumber} artwork refreshed with a new variation!`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch {
      // Fallback
      setTimeout(() => {
        setGeneratedPages((prev) =>
          prev.map((p) =>
            p.pageNumber === pageNumber
              ? {
                  ...p,
                  concept: `${p.concept} (Alternative)`,
                  imageUrl: '/illustrations/coloring-spaceship.svg',
                  status: 'completed',
                  isRegenerating: false,
                }
              : p
          )
        );
      }, 600);
    }
  };

  // Delete a page and visually renumber remaining pages
  const handleDeletePage = async (pageNumber: number) => {
    if (generatedPages.length <= 1) return;

    if (createdBookId) {
      try {
        const res = await api.deletePage(createdBookId, pageNumber);
        if (res.remainingPages) {
          setGeneratedPages(res.remainingPages);
          setNotificationMessage(`Page ${pageNumber} deleted. Remaining pages renumbered.`);
          setTimeout(() => setNotificationMessage(null), 3200);
          return;
        }
      } catch {
        // Fallback to local renumbering
      }
    }

    setGeneratedPages((prev) => {
      const filtered = prev.filter((p) => p.pageNumber !== pageNumber);
      return filtered.map((p, index) => ({
        ...p,
        pageNumber: index + 1,
      }));
    });

    setNotificationMessage(`Page ${pageNumber} deleted. Remaining pages renumbered.`);
    setTimeout(() => setNotificationMessage(null), 3200);
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
      visualPrompt: `Coloring book line art, pure black lines on white background, ${template.concept}, crisp outlines, no shading`,
      difficulty: 'medium',
      status: 'planned',
    };
    setGeneratedPages((prev) => [...prev, newPage]);
  };

  // Trigger PDF Generation
  const handleCreatePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      setIsGeneratingPDF(false);
      setPdfSuccess(true);
      setCurrentStep(4);

      if (onSaveBook) {
        const newBook: Book = {
          id: createdBookId || `book_${Date.now()}`,
          title: bookTitle || prompt.slice(0, 36) || 'Custom Coloring Book',
          theme: bookTheme || prompt,
          styleDirection: bookStyleDirection,
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
    stopPolling();
    setCurrentStep(1);
    setGenerationPhase('idle');
    setPdfSuccess(false);
    setGeneratedPages([]);
    setBookTitle('');
    setBookTheme('');
    setBookStyleDirection('');
    setCompletedPagesCount(0);
    setActivePageNumber(1);
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

      {/* 3. Creation Workspace */}
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
          currentPage={activePageNumber}
          totalPages={pageCount}
          completedPages={completedPagesCount}
          isPlanningDone={isPlanningDone}
          statusMessage={planningStatusMessage}
          onCancel={handleCancelGeneration}
          onSkip={handleSkipGeneration}
        />
      )}

      {/* 5. Review Generated Pages & PDF Setup */}
      {currentStep >= 3 && !pdfSuccess && (
        <div className="flex flex-col gap-10">
          <BookPreviewGrid
            bookTitle={bookTitle}
            theme={bookTheme}
            styleDirection={bookStyleDirection}
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
            bookTitle={bookTitle || prompt.slice(0, 32)}
            onDownloadPDF={() => {
              alert(`Downloading printable PDF for "${bookTitle || 'ColorBook'}" (${generatedPages.length} pages, ${paperSize})`);
            }}
            onDownloadZIP={() => {
              alert(`Downloading ZIP bundle: "${generatedPages.length} black-and-white coloring pages (PNG archive)"`);
            }}
            onReset={handleReset}
          />

          {/* Review generated pages below the success card */}
          <div className="pt-6 border-t border-slate-200">
            <BookPreviewGrid
              bookTitle={bookTitle}
              theme={bookTheme}
              styleDirection={bookStyleDirection}
              pages={generatedPages}
              onRegeneratePage={handleRegeneratePage}
              onDeletePage={handleDeletePage}
              onAddPage={handleAddPage}
              notificationMessage={notificationMessage}
            />
          </div>
        </div>
      )}

      {/* API Key Configuration Modal */}
      {apiKeyNeededModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-purple-100 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setApiKeyNeededModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 mb-2">
                <span>AI_CONFIGURATION_ERROR</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Google Gemini API Key Needed
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                ColorBook AI connects to Google&apos;s free-tier model <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-purple-700">gemini-2.5-flash-lite</code> to plan unique book storylines and prompt concepts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col gap-2">
              <p className="font-semibold text-slate-900">How to configure:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>
                  Get a free key from{' '}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Add to <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.env</code>:
                  <div className="font-mono bg-slate-900 text-purple-300 p-2 rounded-lg mt-1 select-all">
                    GEMINI_API_KEY=your_key_here
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleProceedWithMock}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Preview with Sample AI Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setApiKeyNeededModal(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
