import React from 'react';
import { RefreshCw, Trash2, Eye, Sparkles, Loader2, Code2, AlertTriangle, Clock } from 'lucide-react';
import type { ColoringPageItem } from '../types';
import { getAssetUrl } from '../lib/api';

interface ColoringPageCardProps {
  page: ColoringPageItem;
  onRegenerate: (pageNumber: number) => void;
  onDelete: (pageNumber: number) => void;
  onView: (page: ColoringPageItem) => void;
  isOnlyPage?: boolean;
}

export const ColoringPageCard: React.FC<ColoringPageCardProps> = ({
  page,
  onRegenerate,
  onDelete,
  onView,
  isOnlyPage = false,
}) => {
  const isGenerating = page.status === 'generating' || page.isRegenerating;
  const isFailed = page.status === 'failed';
  const isCompleted = page.status === 'completed' && Boolean(page.imageUrl);
  const isPlanned = page.status === 'planned' || (!isCompleted && !isFailed && !isGenerating);

  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [page.imageUrl]);

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return {
          label: 'Easy',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'medium':
        return {
          label: 'Medium',
          classes: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'detailed':
        return {
          label: 'Detailed',
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'intricate':
        return {
          label: 'Intricate',
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          label: difficulty || 'Standard',
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const difficultyInfo = getDifficultyBadge(page.difficulty);

  return (
    <div className={`group relative flex flex-col rounded-2xl border-2 bg-white overflow-hidden shadow-2xs transition-all duration-200 ${
      isFailed
        ? 'border-rose-200 hover:border-rose-300'
        : isGenerating
        ? 'border-purple-300 shadow-purple-500/10'
        : 'border-slate-200/90 hover:shadow-card-hover hover:border-purple-300'
    }`}>
      {/* Page Display Area */}
      <div className="relative aspect-3/4 w-full bg-slate-50/50 flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
        {/* State 1: Active Generation in Progress */}
        {isGenerating && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-radial from-purple-50 via-white to-slate-50">
            <div className="relative w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-xs">
              <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
            </div>
            <span className="text-xs font-bold text-purple-900 bg-purple-100/90 px-2.5 py-1 rounded-full mb-1">
              Generating artwork…
            </span>
            <p className="text-[11px] text-slate-500 line-clamp-2 px-1">
              {page.concept || 'Drawing black-and-white coloring lines'}
            </p>
          </div>
        )}

        {/* State 2: Generation Failed */}
        {!isGenerating && isFailed && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-rose-50/60 rounded-xl border border-rose-200/80">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5 shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full mb-1">
              Generation failed
            </span>
            <p className="text-[11px] text-rose-600 font-medium line-clamp-2 px-1 mb-3">
              We couldn&apos;t generate this page.
            </p>
            <button
              type="button"
              onClick={() => onRegenerate(page.pageNumber)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          </div>
        )}

        {/* State 3: Completed Artwork */}
        {!isGenerating && !isFailed && isCompleted && page.imageUrl && (
          imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-50/80 rounded-xl border border-slate-200">
              <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-xs font-bold text-slate-700 mb-1">
                Preview Unavailable
              </span>
              <p className="text-[11px] text-slate-500 line-clamp-2 px-1 mb-3">
                Artwork could not be loaded.
              </p>
              <button
                type="button"
                onClick={() => {
                  setImageError(false);
                  onRegenerate(page.pageNumber);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>
              <img
                src={getAssetUrl(page.imageUrl)}
                alt={page.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-contain filter contrast-125 transition-transform duration-300 group-hover:scale-102"
                loading="lazy"
              />
              {/* Hover Action Overlay: View Full Details */}
              <div className="absolute inset-0 bg-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                <button
                  type="button"
                  onClick={() => onView(page)}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-bold shadow-md hover:bg-white hover:text-purple-600 cursor-pointer transform translate-y-2 group-hover:translate-y-0 transition-all border border-slate-200/70"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Artwork</span>
                </button>
              </div>
            </>
          )
        )}

        {/* State 4: Planned / Waiting in Queue */}
        {!isGenerating && !isFailed && isPlanned && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-radial from-purple-50/70 via-white to-slate-50 border-2 border-dashed border-purple-200/90 rounded-xl transition-all group-hover:border-purple-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-purple-100" />
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full mb-2 border border-purple-200">
              <Clock className="w-3 h-3" />
              Waiting in queue
            </span>

            <p className="text-[11px] text-slate-600 font-medium line-clamp-3 px-1 leading-relaxed">
              {page.concept}
            </p>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-900/85 text-white backdrop-blur-xs shadow-2xs">
            Page {page.pageNumber}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${difficultyInfo.classes}`}
          >
            {difficultyInfo.label}
          </span>
        </div>
      </div>

      {/* Card Info & Actions */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2 bg-slate-50/40">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-xs font-extrabold text-slate-900 truncate" title={page.title}>
              {page.title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug" title={page.concept}>
            {page.concept}
          </p>
        </div>

        {/* Visual prompt inspector link */}
        {page.visualPrompt && (
          <button
            type="button"
            onClick={() => onView(page)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer w-fit"
            title="Inspect line art generation prompt"
          >
            <Code2 className="w-3 h-3" />
            <span>View AI Prompt</span>
          </button>
        )}

        {/* Action Buttons: Regenerate and Delete */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRegenerate(page.pageNumber)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-100/70 transition-colors cursor-pointer disabled:opacity-50"
            title="Regenerate artwork for this single page"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Drawing…' : 'Regenerate'}</span>
          </button>

          <button
            type="button"
            disabled={isOnlyPage || isGenerating}
            onClick={() => onDelete(page.pageNumber)}
            className={`p-1.5 rounded-lg text-slate-400 transition-colors ${
              isOnlyPage
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
            }`}
            title={isOnlyPage ? 'Cannot delete the only page' : 'Delete this page'}
            aria-label={`Delete Page ${page.pageNumber}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
