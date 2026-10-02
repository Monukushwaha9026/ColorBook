import React from 'react';
import { Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-6 pb-4 sm:pt-8 sm:pb-6 text-center max-w-3xl mx-auto px-4">
      {/* Decorative subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-36 bg-purple-200/40 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Small badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold tracking-wider uppercase mb-3 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-200" />
        <span>AI Coloring Book Creator</span>
      </div>

      {/* Large heading */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
        Create a coloring book from{' '}
        <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
          your imagination.
        </span>
      </h1>

      {/* Supporting text */}
      <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
        Describe a theme, choose your audience, and let AI create printable black-and-white coloring pages for you.
      </p>
    </div>
  );
};
