import React, { useState } from 'react';
import { X, Printer, Download, Sparkles, Copy, Check, Code2, Image as ImageIcon } from 'lucide-react';
import type { ColoringPageItem } from '../types';
import { getAssetUrl } from '../lib/api';

interface PageModalProps {
  page: ColoringPageItem | null;
  onClose: () => void;
}

export const PageModal: React.FC<PageModalProps> = ({ page, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState<'preview' | 'prompt'>('preview');
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [page?.imageUrl]);

  if (!page) return null;

  const handleCopyPrompt = () => {
    if (page.visualPrompt) {
      navigator.clipboard.writeText(page.visualPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (!page.imageUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${page.title} - ColorBook AI</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${getAssetUrl(page.imageUrl)}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Page {page.pageNumber}
              </span>
              {page.difficulty && (
                <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md capitalize">
                  {page.difficulty}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight mt-1">
              {page.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {page.imageUrl && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs transition-colors cursor-pointer"
                title="Print this single page"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls (if both artwork and prompt exist) */}
        {page.visualPrompt && page.imageUrl && (
          <div className="flex items-center gap-2 px-6 pt-3 bg-white border-b border-slate-100">
            <button
              type="button"
              onClick={() => setViewTab('preview')}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                viewTab === 'preview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Artwork Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('prompt')}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                viewTab === 'prompt'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>AI Line-Art Prompt</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col items-center justify-center">
          {viewTab === 'preview' && (
            <div className="w-full flex flex-col items-center justify-center">
              {page.imageUrl && !imageError ? (
                <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-slate-300/80 max-w-md w-full">
                  <img
                    src={getAssetUrl(page.imageUrl)}
                    alt={page.title}
                    onError={() => setImageError(true)}
                    className="w-full h-auto object-contain mx-auto"
                  />
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>ColorBook AI • Printable Black & White Line Art</span>
                    <span>Page {page.pageNumber}</span>
                  </div>
                </div>
              ) : page.imageUrl && imageError ? (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Image Preview Unavailable</h4>
                  <p className="text-xs text-slate-500 mb-2">Could not load the image from storage.</p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-purple-100 max-w-md w-full text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-md shadow-purple-500/20">
                    <Sparkles className="w-8 h-8 text-purple-100" />
                  </div>
                  <span className="inline-flex items-center text-xs font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full mb-3 border border-purple-200">
                    Artwork coming in Step 4
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mb-2">
                    {page.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {page.concept}
                  </p>

                  {page.visualPrompt && (
                    <div className="w-full text-left bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Visual Prompt for Line Art:
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPrompt}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 select-all break-words leading-relaxed">
                        {page.visualPrompt}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {viewTab === 'prompt' && page.visualPrompt && (
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Visual Prompt Specification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Engineered by Google Gemini for future black-and-white coloring page generators.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto select-all">
                {page.visualPrompt}
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900">
                <p className="font-semibold mb-0.5">Prompt Characteristics:</p>
                <ul className="list-disc list-inside space-y-0.5 text-purple-800 text-[11px]">
                  <li>Crisp pure black line art on clean white background</li>
                  <li>Zero grayscale, zero drop shadows, enclosed outlines</li>
                  <li>Calibrated for {page.difficulty || 'standard'} difficulty level</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="line-clamp-1 max-w-[80%]">
            {page.concept || 'ColorBook AI planned page concept.'}
          </span>
          {page.imageUrl && (
            <a
              href={getAssetUrl(page.imageUrl)}
              download={`colorbook-page-${page.pageNumber}.png`}
              className="inline-flex items-center gap-1 text-purple-600 font-semibold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Image</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
