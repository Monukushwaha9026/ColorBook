import React from 'react';
import { Palette, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-white/70 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900">ColorBook <span className="text-purple-600">AI</span></span>
          <span className="text-slate-300">•</span>
          <span>Turn your ideas into printable coloring books</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>for kids, parents, teachers & creative dreamers</span>
        </div>
      </div>
    </footer>
  );
};
