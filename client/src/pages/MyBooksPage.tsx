import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Download, Plus, Trash2, Loader2, AlertCircle, RefreshCw, FileText, Check, Clock, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { api, ApiClientError, getAssetUrl } from '../lib/api';
import type { Book } from '../types';

interface MyBooksPageProps {
  onOpenBook: (book: Book) => void;
  onCreateClick: () => void;
}

export const MyBooksPage: React.FC<MyBooksPageProps> = ({
  onOpenBook,
  onCreateClick,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.listBooks();
      setBooks(res.books || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Could not load your saved coloring books. Please verify your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this coloring book? This cannot be undone.')) {
      return;
    }

    setDeletingId(bookId);
    try {
      await api.deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete the book. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    if (book.pdfStatus === 'stale') {
      if (window.confirm('The artwork in this book was modified since the last PDF was created. Would you like to open it to regenerate an updated PDF?')) {
        onOpenBook(book);
      }
      return;
    }

    if (book.pdfStatus !== 'completed') {
      onOpenBook(book);
      return;
    }

    const downloadUrl = api.getPdfDownloadUrl(book.id);
    const safeTitle = (book.title || book.prompt || 'coloring-book')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${safeTitle || 'coloring-book'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getAgeLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case 'kids':
        return 'Kids (3–6)';
      case 'children':
        return 'Children (7–10)';
      case 'teens':
        return 'Teens (11–13)';
      case 'teen_plus':
        return 'Teen+ (14–17)';
      default:
        return ageGroup;
    }
  };

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
            Access, review, modify, and download your generated printable coloring books.
          </p>
        </div>

        {books.length > 0 && !isLoading && (
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer self-start sm:self-auto hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Book</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm font-semibold text-slate-600">Loading your coloring books…</p>
        </div>
      )}

      {/* Error State with Retry */}
      {!isLoading && error && (
        <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center flex flex-col items-center gap-4">
          <AlertCircle className="w-8 h-8 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-rose-900">Could not load books</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchBooks}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-700 hover:bg-rose-100/50 cursor-pointer transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && books.length === 0 && (
        <div className="py-12">
          <EmptyState
            title="No coloring books yet"
            description="Create your first coloring book and your generated pages will appear here."
            buttonText="Create Book"
            onButtonClick={onCreateClick}
            illustrationSrc="/illustrations/icon-book-3d.png"
          />
        </div>
      )}

      {/* Populated Books Grid */}
      {!isLoading && !error && books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const hasPdf = book.pdfStatus === 'completed';
            const isStalePdf = book.pdfStatus === 'stale';
            const isGenerating = book.status === 'generating';
            const isFailed = book.status === 'failed';
            const rawThumbnail = book.coverImage || book.pages?.[0]?.imageUrl || '/illustrations/icon-book-3d.png';
            const thumbnail = getAssetUrl(rawThumbnail);

            return (
              <div
                key={book.id}
                onClick={() => onOpenBook(book)}
                className="group flex flex-col rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-soft hover:shadow-card-hover hover:border-purple-300 transition-all cursor-pointer"
              >
                {/* Cover Preview Area */}
                <div className="relative aspect-4/3 bg-gradient-to-b from-slate-50 to-purple-50/20 border-b border-slate-100 flex items-center justify-center p-4">
                  <div className="w-32 h-44 bg-white rounded-xl shadow-md border-2 border-slate-200/90 p-2 transform group-hover:scale-105 transition-transform duration-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={thumbnail}
                      alt={book.title || 'Coloring Book'}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Top Badge: Page Count */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-purple-700 shadow-2xs border border-purple-100 backdrop-blur-xs">
                      {book.pageCount} {book.pageCount === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>

                  {/* Top Left Badge: Status */}
                  <div className="absolute top-3 left-3">
                    {isGenerating ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating…</span>
                      </span>
                    ) : isFailed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Needs Attention</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 group-hover:text-purple-700 transition-colors" title={book.title || book.prompt}>
                      {book.title || book.prompt || 'Custom Coloring Book'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                      &ldquo;{book.prompt}&rdquo;
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(book.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        {getAgeLabel(book.ageGroup)}
                      </span>
                    </div>
                  </div>

                  {/* PDF Status indicator pill */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {hasPdf ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                          <Check className="w-3 h-3" /> PDF Ready
                        </span>
                      ) : isStalePdf ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200" title="Artwork was updated after PDF generation">
                          <Clock className="w-3 h-3" /> PDF Outdated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <FileText className="w-3 h-3" /> No PDF Yet
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 text-2xs">
                      {book.paperSize || 'A4'} • {book.orientation === 'LANDSCAPE' ? 'Landscape' : 'Portrait'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBook(book);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open Book</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, book)}
                        disabled={!hasPdf && !isStalePdf}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          hasPdf
                            ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800'
                            : isStalePdf
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 bg-slate-50 cursor-not-allowed'
                        }`}
                        title={
                          hasPdf
                            ? 'Download Printable PDF'
                            : isStalePdf
                            ? 'Artwork updated - click to open and regenerate PDF'
                            : 'Open book to generate PDF'
                        }
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === book.id}
                        onClick={(e) => handleDelete(e, book.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete book"
                      >
                        {deletingId === book.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
