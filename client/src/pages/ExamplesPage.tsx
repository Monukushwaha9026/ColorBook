import React, { useState } from 'react';
import { Sparkles, Layers, Filter } from 'lucide-react';
import { THEME_CATEGORIES, MOCK_COLORING_PAGES_MASTER } from '../data/mockData';
import { ThemeCard } from '../components/ThemeCard';
import { PageModal } from '../components/PageModal';
import type { ColoringPageItem } from '../types';

interface ExamplesPageProps {
  onUsePrompt: (promptText: string) => void;
}

export const ExamplesPage: React.FC<ExamplesPageProps> = ({ onUsePrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewPage, setPreviewPage] = useState<ColoringPageItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Themes' },
    ...THEME_CATEGORIES.map((t) => ({ id: t.id, label: t.name })),
  ];

  const filteredThemes =
    selectedCategory === 'all'
      ? THEME_CATEGORIES
      : THEME_CATEGORIES.filter((t) => t.id === selectedCategory);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          <span>Curated Themes & Examples</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore ColorBook Ideas
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Discover popular coloring themes and printable page styles. Select any theme to jumpstart your book creation.
        </p>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            onSelectPrompt={onUsePrompt}
          />
        ))}
      </div>

      {/* Featured Printable Line Art Showcase */}
      <div className="mt-16 pt-12 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pure Black & White Line Art Showcase</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Sample Printable Pages
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Every page is designed with clean black outlines on a pure white background for crisp printing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {MOCK_COLORING_PAGES_MASTER.slice(0, 5).map((page) => (
            <div
              key={page.id}
              onClick={() => setPreviewPage(page)}
              className="group relative flex flex-col rounded-2xl border-2 border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-card-hover hover:border-purple-400 transition-all cursor-pointer"
            >
              <div className="aspect-3/4 w-full bg-white p-3 flex items-center justify-center border-b border-slate-100">
                <img
                  src={page.imageUrl}
                  alt={page.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 bg-slate-50/60">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {page.title}
                </p>
                <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
                  Click to inspect & print
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox inspection modal */}
      <PageModal
        page={previewPage}
        onClose={() => setPreviewPage(null)}
      />
    </div>
  );
};
