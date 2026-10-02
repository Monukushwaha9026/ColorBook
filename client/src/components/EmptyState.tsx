import React from 'react';
import { ArrowRight, BookPlus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  illustrationSrc?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
  illustrationSrc = '/illustrations/icon-book-3d.png',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-soft max-w-lg mx-auto">
      {/* 3D Book Illustration */}
      <div className="w-24 h-20 mb-4 flex items-center justify-center">
        <img
          src={illustrationSrc}
          alt="Illustration"
          className="w-full h-full object-contain filter drop-shadow-sm"
        />
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>

      {buttonText && onButtonClick && (
        <button
          type="button"
          onClick={onButtonClick}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <BookPlus className="w-4 h-4" />
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
