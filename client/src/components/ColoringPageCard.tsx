import React from 'react';
import { RefreshCw, Trash2, Eye, Sparkles, Loader2, Code2 } from 'lucide-react';
import type { ColoringPageItem } from '../types';

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
          label: difficulty || 'Planned',
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const difficultyInfo = getDifficultyBadge(page.difficulty);

  return (
    <div className="group relative flex flex-col rounded-2xl border-2 border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-card-hover hover:border-purple-300 transition-all duration-200">
      {/* Page Display Area (Line art or Step 3 Planned Placeholder) */}
      <div className="relative aspect-3/4 w-full bg-slate-50/50 flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
        {page.imageUrl ? (
          <img
            src={page.imageUrl}
            alt={page.title}
            className={`w-full h-full object-contain filter contrast-125 transition-transform duration-300 group-hover:scale-102 ${
              page.isRegenerating ? 'opacity-30 blur-2xs' : 'opacity-100'
            }`}
            loading="lazy"
          />
        ) : (
          /* Step 3: Planned Page Concept Card with "Artwork coming next" */
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-radial from-purple-50/70 via-white to-slate-50 border-2 border-dashed border-purple-200/90 rounded-xl transition-all group-hover:border-purple-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-purple-100" />
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full mb-2 border border-purple-200">
              Artwork coming next
            </span>

            <p className="text-[11px] text-slate-600 font-medium line-clamp-3 px-1 leading-relaxed">
              {page.concept}
            </p>
          </div>
        )}

        {/* Regenerating Spinner Overlay */}
        {page.isRegenerating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-20 animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-full">
              Updating concept…
            </span>
          </div>
        )}

        {/* Hover Action Overlay: View Full Details / Prompt */}
        <div className="absolute inset-0 bg-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
          <button
            type="button"
            onClick={() => onView(page)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-bold shadow-md hover:bg-white hover:text-purple-600 cursor-pointer transform translate-y-2 group-hover:translate-y-0 transition-all border border-slate-200/70"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Concept</span>
          </button>
        </div>

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
            disabled={page.isRegenerating}
            onClick={() => onRegenerate(page.pageNumber)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-100/70 transition-colors cursor-pointer disabled:opacity-50"
            title="Regenerate concept for this page"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${page.isRegenerating ? 'animate-spin' : ''}`}
            />
            <span>{page.isRegenerating ? 'Updating…' : 'Regenerate'}</span>
          </button>

          <button
            type="button"
            disabled={isOnlyPage || page.isRegenerating}
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
