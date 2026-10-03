import React from 'react';
import { Check, Loader2, Sparkles, XCircle } from 'lucide-react';

interface GenerationProgressProps {
  currentPage: number;
  totalPages: number;
  completedPages?: number;
  isPlanningDone: boolean;
  statusMessage?: string;
  onCancel?: () => void;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  currentPage,
  totalPages,
  completedPages = 0,
  isPlanningDone,
  statusMessage,
  onCancel,
}) => {
  // If planning is done, progress represents real generation: 20% base + 80% * (completed / total)
  const percent = isPlanningDone
    ? Math.min(100, Math.round(20 + (completedPages / totalPages) * 80))
    : 15;

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-soft text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Top icon and title */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/80 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Coloring Book Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isPlanningDone
              ? completedPages >= totalPages
                ? 'Coloring book ready!'
                : `Creating page ${Math.min(currentPage, totalPages)} of ${totalPages}`
              : 'Planning your coloring book…'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {statusMessage ||
              (isPlanningDone
                ? `Generating printable black-and-white line art (${completedPages}/${totalPages} completed)`
                : 'Google Gemini 2.5 Flash Lite is planning your unique page storylines…')}
          </p>
        </div>
      </div>

      {/* Real Step Status Checklist */}
      <div className="mt-6 max-w-md mx-auto bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 text-left">
        {/* Step 1: AI Book Planning */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isPlanningDone
                  ? 'bg-emerald-500 text-white'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {isPlanningDone ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
            </div>
            <span className={isPlanningDone ? 'text-slate-800 font-semibold' : 'text-purple-700 font-semibold'}>
              Planning pages
            </span>
          </div>
          {isPlanningDone ? (
            <span className="text-xs font-bold text-emerald-600">✓ Book plan created</span>
          ) : (
            <span className="text-xs text-purple-600 font-medium">Gemini AI planning…</span>
          )}
        </div>

        {/* Step 2: Generating artwork */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isPlanningDone
                  ? completedPages >= totalPages
                    ? 'bg-emerald-500 text-white'
                    : 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {isPlanningDone ? (
                completedPages >= totalPages ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )
              ) : (
                '2'
              )}
            </div>
            <span className={isPlanningDone ? 'text-purple-700 font-semibold' : 'text-slate-400 font-medium'}>
              {isPlanningDone
                ? completedPages >= totalPages
                  ? 'All artwork generated'
                  : `Generating artwork (${completedPages}/${totalPages})`
                : 'Awaiting line art'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-purple-600">
            {percent}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5 max-w-md mx-auto">
        <div className="w-full h-3 bg-purple-100/80 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Action buttons (Cancel) */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel generation</span>
          </button>
        )}
      </div>
    </div>
  );
};
