import React from 'react';
import { X, Printer, Download, ZoomIn, ZoomOut } from 'lucide-react';
import type { ColoringPageItem } from '../types';

interface PageModalProps {
  page: ColoringPageItem | null;
  onClose: () => void;
}

export const PageModal: React.FC<PageModalProps> = ({ page, onClose }) => {
  const [zoom, setZoom] = React.useState(1);

  if (!page) return null;

  const handlePrint = () => {
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
          <img src="${page.imageUrl}" onload="window.print(); window.close();" />
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Page {page.pageNumber} Inspection
            </span>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {page.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.25, 2))}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs transition-colors cursor-pointer"
              title="Print this single page"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Page</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Image Display */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/70 min-h-[360px]">
          <div
            className="bg-white p-6 rounded-2xl shadow-md border-2 border-slate-300/80 max-w-md w-full transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={page.imageUrl}
              alt={page.title}
              className="w-full h-auto object-contain mx-auto"
            />
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>ColorBook AI • Printable Black & White Line Art</span>
              <span>Page {page.pageNumber}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{page.description || 'Pure crisp black lines on white background, ready to color.'}</span>
          <a
            href={page.imageUrl}
            download={`colorbook-page-${page.pageNumber}.png`}
            className="inline-flex items-center gap-1 text-purple-600 font-semibold hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Image</span>
          </a>
        </div>
      </div>
    </div>
  );
};
