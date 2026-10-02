import React, { useState } from 'react';
import { BookOpen, Calendar, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageModal } from '../components/PageModal';
import type { Book, ColoringPageItem } from '../types';

interface MyBooksPageProps {
  books: Book[];
  onCreateClick: () => void;
  onDeleteBook: (id: string) => void;
}

export const MyBooksPage: React.FC<MyBooksPageProps> = ({
  books,
  onCreateClick,
  onDeleteBook,
}) => {
  const [selectedPageForModal, setSelectedPageForModal] = useState<ColoringPageItem | null>(null);
  const [activeBookForPages, setActiveBookForPages] = useState<Book | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
              <BookOpen className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your coloring books
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access and download your previously generated printable coloring books.
          </p>
        </div>

        {books.length > 0 && (
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Book</span>
          </button>
        )}
      </div>

      {/* Empty State when no books exist */}
      {books.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No coloring books yet"
            description="Create your first coloring book and your generated books will appear here."
            buttonText="Create a Book"
            onButtonClick={onCreateClick}
            illustrationSrc="/illustrations/icon-book-3d.png"
          />
        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-soft hover:shadow-card-hover hover:border-purple-300 transition-all"
            >
              {/* Cover Preview Area */}
              <div
                className="relative aspect-4/3 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 cursor-pointer group"
                onClick={() => {
                  if (book.pages.length > 0) {
                    setActiveBookForPages(book);
                  }
                }}
              >
                <div className="w-36 h-48 bg-white rounded-xl shadow-md border-2 border-slate-200/80 p-2 transform group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-purple-700 shadow-xs border border-purple-100 backdrop-blur-xs">
                    {book.pageCount} Pages
                  </span>
                </div>
              </div>

              {/* Book Details */}
              <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-1" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                    &ldquo;{book.prompt}&rdquo;
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(book.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-purple-600">
                      {book.paperSize} • {book.orientation}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveBookForPages(book)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Pages</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        alert(`Downloading PDF for "${book.title}" (${book.pageCount} pages, ${book.paperSize})`)
                      }
                      className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBook(book.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete book"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pages Modal Drawer when viewing a book's pages */}
      {activeBookForPages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveBookForPages(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  Book Pages Overview
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeBookForPages.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveBookForPages(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {activeBookForPages.pages.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPageForModal(p)}
                  className="rounded-2xl border-2 border-slate-200 p-2 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group bg-white"
                >
                  <div className="aspect-3/4 w-full bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={p.imageUrl || undefined}
                      alt={p.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800 truncate">
                    Page {p.pageNumber}: {p.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual Page Inspection Modal */}
      <PageModal
        page={selectedPageForModal}
        onClose={() => setSelectedPageForModal(null)}
      />
    </div>
  );
};
