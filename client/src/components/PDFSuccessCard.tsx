import React, { useEffect } from 'react';
import { Download, Archive, Check, Sparkles, RefreshCw, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { PaperSize, Orientation } from '../types';

interface PDFSuccessCardProps {
  pageCount: number;
  paperSize: PaperSize;
  orientation: Orientation;
  bookTitle?: string;
  onDownloadPDF: () => void;
  onDownloadZIP: () => void;
  onReset: () => void;
}

export const PDFSuccessCard: React.FC<PDFSuccessCardProps> = ({
  pageCount,
  paperSize,
  orientation,
  bookTitle = 'ColorBook AI - Adventure Edition',
  onDownloadPDF,
  onDownloadZIP,
  onReset,
}) => {
  useEffect(() => {
    // Fire celebratory confetti bursts
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7C3AED', '#A855F7', '#C084FC', '#3B82F6', '#10B981'],
    });
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-white to-purple-50/40 border-2 border-purple-200/90 shadow-soft text-center animate-in fade-in zoom-in-95 duration-400">
      {/* Success Badge */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/20 ring-8 ring-emerald-50">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>
        <div className="absolute -top-1 -right-2">
          <Sparkles className="w-6 h-6 text-amber-400 fill-amber-300 animate-bounce" />
        </div>
      </div>

      {/* Heading and details */}
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Your Coloring Book is Ready!
      </h2>

      {bookTitle && (
        <p className="mt-1 text-sm font-medium text-slate-500 italic max-w-md mx-auto truncate">
          &ldquo;{bookTitle}&rdquo;
        </p>
      )}

      <p className="mt-2 text-sm font-semibold text-purple-700 bg-purple-100/60 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-purple-200">
        <FileText className="w-4 h-4 text-purple-600" />
        <span>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'} • {paperSize} • {orientation === 'PORTRAIT' ? 'Portrait' : 'Landscape'}
        </span>
      </p>

      <p className="mt-3 text-sm text-slate-600 max-w-md mx-auto">
        Your custom black-and-white coloring pages are formatted and ready to print on standard home and school printers.
      </p>

      {/* Download Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={onDownloadPDF}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/25 hover:shadow-purple-600/35 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          onClick={onDownloadZIP}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-300 hover:border-purple-300 hover:bg-purple-50/50 text-slate-700 font-bold text-sm shadow-xs transition-all cursor-pointer"
        >
          <Archive className="w-4 h-4 text-slate-500" />
          <span>Download images as ZIP</span>
        </button>
      </div>

      {/* Start New Book Link */}
      <div className="mt-8 pt-6 border-t border-purple-100 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Create another coloring book</span>
        </button>
      </div>
    </div>
  );
};
