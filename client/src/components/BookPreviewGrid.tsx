import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import type { ColoringPageItem } from '../types';
import { ColoringPageCard } from './ColoringPageCard';
import { PageModal } from './PageModal';

interface BookPreviewGridProps {
  bookTitle?: string;
  theme?: string;
  styleDirection?: string;
  pages: ColoringPageItem[];
  onRegeneratePage: (pageNumber: number) => void;
  onDeletePage: (pageNumber: number) => void;
  onAddPage?: () => void;
  notificationMessage?: string | null;
}

export const BookPreviewGrid: React.FC<BookPreviewGridProps> = ({
  bookTitle,
  theme,
  styleDirection,
  pages,
  onRegeneratePage,
  onDeletePage,
  onAddPage,
  notificationMessage,
}) => {
  const [selectedPageForModal, setSelectedPageForModal] = useState<ColoringPageItem | null>(null);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Book Metadata Banner if title & theme are planned */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-white to-indigo-50/40 border border-purple-100/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                  <Sparkles className="w-3 h-3" />
                  AI Book Plan
                </span>
                {theme && (
                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    Theme: {theme}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                {bookTitle || 'Custom Coloring Book'}
              </h2>
              {styleDirection && (
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-600">Style Direction:</span> {styleDirection}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} Planned
            </span>
            {onAddPage && pages.length < 10 && (
              <button
                type="button"
                onClick={onAddPage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:border-purple-400 hover:text-purple-700 bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Page</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle feedback notification (e.g. after deletion or page addition) */}
      {notificationMessage && (
        <div
          role="status"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-semibold animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Section Sub-header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Click any card to inspect the concept and prompt details.</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Artwork coming next in Step 4
        </span>
      </div>

      {/* Responsive Grid: 4 cols desktop, 2-3 tablet, 1-2 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {pages.map((page) => (
          <ColoringPageCard
            key={page.id}
            page={page}
            onRegenerate={onRegeneratePage}
            onDelete={onDeletePage}
            onView={(p) => setSelectedPageForModal(p)}
            isOnlyPage={pages.length <= 1}
          />
        ))}
      </div>

      {/* Lightbox / Prompt inspection modal */}
      <PageModal
        page={selectedPageForModal}
        onClose={() => setSelectedPageForModal(null)}
      />
    </div>
  );
};
