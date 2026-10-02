import React from 'react';

interface PageCountSelectorProps {
  pageCount: number;
  onSelect: (count: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export const PageCountSelector: React.FC<PageCountSelectorProps> = ({
  pageCount,
  onSelect,
  disabled = false,
  min = 1,
  max = 10,
}) => {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm sm:text-base font-bold text-slate-900">
          Number of Pages
        </label>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-700">
          {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
        </span>
      </div>

      {/* Segmented 1-10 selector buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80">
        {options.map((num) => {
          const isSelected = pageCount === num;
          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(num)}
              className={`h-10 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30 scale-102 ring-2 ring-purple-300/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-pressed={isSelected}
            >
              {num}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Create between 1 and 10 unique coloring pages.
      </p>
    </div>
  );
};
