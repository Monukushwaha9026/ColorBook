import React from 'react';
import { Check, Loader2, Sparkles, FastForward } from 'lucide-react';

interface GenerationProgressProps {
  currentPage: number;
  totalPages: number;
  isPlanningDone: boolean;
  statusMessage?: string;
  onSkip?: () => void;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  currentPage,
  totalPages,
  isPlanningDone,
  statusMessage,
  onSkip,
}) => {
  const percent = isPlanningDone
    ? Math.min(100, Math.round(30 + (currentPage / totalPages) * 70))
    : 20;

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
            <span>Google Gemini AI Planner</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isPlanningDone ? 'Designing your coloring pages…' : 'Planning your coloring book…'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {statusMessage ||
              (isPlanningDone
                ? `Structuring page concept ${currentPage} of ${totalPages}…`
                : 'Formulating unique storylines and age-appropriate line complexity…')}
          </p>
        </div>
      </div>

      {/* Steps checklist */}
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
              AI Book Planning
            </span>
          </div>
          {isPlanningDone ? (
            <span className="text-xs font-bold text-emerald-600">✓ Complete</span>
          ) : (
            <span className="text-xs text-purple-600 font-medium">Gemini 2.5 Flash Lite…</span>
          )}
        </div>

        {/* Step 2: Line Art Prompts & Difficulty */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isPlanningDone
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {isPlanningDone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '2'}
            </div>
            <span className={isPlanningDone ? 'text-purple-700 font-semibold' : 'text-slate-400 font-medium'}>
              {isPlanningDone
                ? `Calibrating concept ${currentPage} of ${totalPages}`
                : 'Awaiting page outline'}
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

      {/* Fast-forward preview button */}
      {onSkip && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            title="Fast forward preview"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Fast-forward preview</span>
          </button>
        </div>
      )}
    </div>
  );
};
