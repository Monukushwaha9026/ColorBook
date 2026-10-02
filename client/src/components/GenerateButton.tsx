import React from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  pageCount: number;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  pageCount,
  onClick,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-200 overflow-hidden ${
          disabled || isLoading
            ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 text-purple-200 animate-spin" />
            <span>Creating your book…</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 group-hover:rotate-12 transition-transform duration-200" />
            <span>Generate Coloring Book</span>
            <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 font-medium">
        Your book will contain <strong className="text-slate-700">{pageCount} unique</strong> coloring pages.
      </p>
    </div>
  );
};
