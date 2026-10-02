import React from 'react';
import type { SuggestedPrompt } from '../types';

interface SuggestionChipProps {
  suggestion: SuggestedPrompt;
  onClick: (promptText: string) => void;
  isSelected?: boolean;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  suggestion,
  onClick,
  isSelected,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(suggestion.prompt)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-purple-100/80 border-purple-300 text-purple-800 shadow-xs'
          : 'bg-white border-slate-200/90 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 shadow-2xs'
      }`}
      title={suggestion.prompt}
    >
      {suggestion.iconSrc ? (
        <img
          src={suggestion.iconSrc}
          alt={suggestion.category}
          className="w-4 h-4 object-contain"
        />
      ) : null}
      <span>{suggestion.label}</span>
    </button>
  );
};
