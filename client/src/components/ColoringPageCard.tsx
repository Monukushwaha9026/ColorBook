import React from 'react';
import { RefreshCw, Trash2, Maximize2, Loader2 } from 'lucide-react';
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
  return (
    <div className="group relative flex flex-col rounded-2xl border-2 border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-card-hover hover:border-purple-300 transition-all duration-200">
      {/* Page Image Display Area (Simulating print paper) */}
      <div className="relative aspect-3/4 w-full bg-white flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
        {/* Actual Line Art Page */}
        <img
          src={page.imageUrl}
          alt={page.title}
          className={`w-full h-full object-contain filter contrast-125 transition-transform duration-300 group-hover:scale-102 ${
            page.isRegenerating ? 'opacity-30 blur-2xs' : 'opacity-100'
          }`}
          loading="lazy"
        />

        {/* Regenerating Spinner Overlay */}
        {page.isRegenerating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-20 animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-full">
              Regenerating…
            </span>
          </div>
        )}

        {/* Hover Action Overlay: View Full Size */}
        <div className="absolute inset-0 bg-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
          <button
            type="button"
            onClick={() => onView(page)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-bold shadow-md hover:bg-white hover:text-purple-600 cursor-pointer transform translate-y-2 group-hover:translate-y-0 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Page Number Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
            Page {page.pageNumber}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2.5 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-slate-800 truncate" title={page.title}>
            {page.title}
          </h3>
          {page.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {page.description}
            </p>
          )}
        </div>

        {/* Action Buttons: Regenerate and Delete */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <button
            type="button"
            disabled={page.isRegenerating}
            onClick={() => onRegenerate(page.pageNumber)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-100/70 transition-colors cursor-pointer disabled:opacity-50"
            title="Redraw this page with another variation"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${page.isRegenerating ? 'animate-spin' : ''}`}
            />
            <span>{page.isRegenerating ? 'Regenerating…' : 'Regenerate'}</span>
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
