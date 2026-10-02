import React from 'react';
import { FileText, ArrowRight, Printer, Check, Loader2 } from 'lucide-react';
import type { PaperSize, Orientation } from '../types';

interface PDFSettingsProps {
  paperSize: PaperSize;
  orientation: Orientation;
  pageCount: number;
  onPaperSizeChange: (size: PaperSize) => void;
  onOrientationChange: (orientation: Orientation) => void;
  onCreatePDF: () => void;
  isGeneratingPDF?: boolean;
}

export const PDFSettings: React.FC<PDFSettingsProps> = ({
  paperSize,
  orientation,
  pageCount,
  onPaperSizeChange,
  onOrientationChange,
  onCreatePDF,
  isGeneratingPDF = false,
}) => {
  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-soft p-6 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Info & Description */}
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Export</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Create and download your PDF
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Turn your selected <strong className="text-slate-700">{pageCount} pages</strong> into a high-resolution, print-ready coloring book formatted with standard margins.
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Check className="w-4 h-4" /> Ready to print
            </span>
            <span>•</span>
            <span>Vector line sharpness</span>
            <span>•</span>
            <span>Standard printer margins</span>
          </div>
        </div>

        {/* Center / Right: Option Selectors and Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Paper Size selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-700">Paper Size</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => onPaperSizeChange('A4')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paperSize === 'A4'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 (Standard)
              </button>
              <button
                type="button"
                onClick={() => onPaperSizeChange('LETTER')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paperSize === 'LETTER'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                US Letter
              </button>
            </div>
          </div>

          {/* Orientation selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-700">Orientation</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => onOrientationChange('PORTRAIT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orientation === 'PORTRAIT'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => onOrientationChange('LANDSCAPE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orientation === 'LANDSCAPE'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Create PDF Action Button */}
          <div className="sm:self-end">
            <button
              type="button"
              disabled={isGeneratingPDF}
              onClick={onCreatePDF}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 hover:shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Create PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
