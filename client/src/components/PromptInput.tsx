import React from 'react';
import { Sparkles, Dices, X, AlertCircle } from 'lucide-react';
import { SuggestionChip } from './SuggestionChip';
import { SUGGESTED_PROMPTS } from '../data/mockData';

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  maxLength?: number;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onChange,
  error,
  disabled = false,
  maxLength = 500,
}) => {
  const handleRandomize = () => {
    if (disabled) return;
    const randomIndex = Math.floor(Math.random() * SUGGESTED_PROMPTS.length);
    onChange(SUGGESTED_PROMPTS[randomIndex].prompt);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header and Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="coloring-prompt"
          className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2"
        >
          <span>What should your coloring book be about?</span>
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={handleRandomize}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          title="Try a random prompt"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Surprise me</span>
        </button>
      </div>

      {/* Textarea container */}
      <div
        className={`relative rounded-2xl border-2 transition-all shadow-2xs ${
          error
            ? 'border-rose-300 bg-rose-50/20 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100'
            : 'border-slate-200 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100'
        } ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}`}
      >
        <textarea
          id="coloring-prompt"
          rows={4}
          disabled={disabled}
          value={prompt}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder="A space adventure with friendly astronauts, rockets, planets and curious aliens..."
          className="w-full p-4 pr-10 rounded-2xl resize-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed focus:outline-hidden bg-transparent"
        />

        {prompt.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-3.5 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clear prompt"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Bottom bar with counter */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 text-xs text-slate-400 border-t border-slate-100/60">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Short or detailed ideas welcome</span>
          </span>
          <span
            className={`font-mono text-xs font-medium ${
              prompt.length > maxLength * 0.9 ? 'text-amber-600 font-bold' : 'text-slate-400'
            }`}
          >
            {prompt.length}/{maxLength}
          </span>
        </div>
      </div>

      {/* Friendly Inline Validation Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggested chips */}
      <div className="pt-1">
        <p className="text-xs font-semibold text-slate-500 mb-2">Need inspiration? Try an idea:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((suggestion) => (
            <SuggestionChip
              key={suggestion.id}
              suggestion={suggestion}
              onClick={(promptText) => !disabled && onChange(promptText)}
              isSelected={prompt === suggestion.prompt}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
