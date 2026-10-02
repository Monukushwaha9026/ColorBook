import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ThemeCategory } from '../types';

interface ThemeCardProps {
  theme: ThemeCategory;
  onSelectPrompt: (prompt: string) => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, onSelectPrompt }) => {
  return (
    <div className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-purple-300 transition-all duration-200">
      <div>
        {/* Top: Icon + Book Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50/70 p-2 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform duration-200">
            <img
              src={theme.iconSrc}
              alt={theme.name}
              className="w-full h-full object-contain filter drop-shadow-2xs"
            />
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {theme.exampleBookCount} Books
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
          {theme.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {theme.description}
        </p>

        {/* Sample Prompt Preview */}
        <div className="mt-3 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/60">
          <p className="text-[11px] text-slate-600 italic line-clamp-2">
            &ldquo;{theme.samplePrompt}&rdquo;
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onSelectPrompt(theme.samplePrompt)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-purple-600 text-slate-700 hover:text-white text-xs font-bold transition-all cursor-pointer group/btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 group-hover/btn:text-amber-300 transition-colors" />
          <span>Use this prompt</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
