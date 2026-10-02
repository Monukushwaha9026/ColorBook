import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2 } from 'lucide-react';
import type { ColoringPageItem } from '../types';
import { ColoringPageCard } from './ColoringPageCard';
import { PageModal } from './PageModal';

interface BookPreviewGridProps {
  pages: ColoringPageItem[];
  onRegeneratePage: (pageNumber: number) => void;
  onDeletePage: (pageNumber: number) => void;
  onAddPage?: () => void;
  notificationMessage?: string | null;
}

export const BookPreviewGrid: React.FC<BookPreviewGridProps> = ({
  pages,
  onRegeneratePage,
  onDeletePage,
  onAddPage,
  notificationMessage,
}) => {
  const [selectedPageForModal, setSelectedPageForModal] = useState<ColoringPageItem | null>(null);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Your Coloring Book
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review your pages before creating the PDF. Click any page to preview full-size.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} Generated
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

      {/* Lightbox inspection modal */}
      <PageModal
        page={selectedPageForModal}
        onClose={() => setSelectedPageForModal(null)}
      />
    </div>
  );
};
