import React, { useState } from 'react';
import { Palette, Sparkles, BookOpen, Layers, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: 'create' | 'examples' | 'my-books';
  onTabChange: (tab: 'create' | 'examples' | 'my-books') => void;
  savedBooksCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  savedBooksCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'create' as const, label: 'Create', icon: Sparkles },
    { id: 'examples' as const, label: 'Examples', icon: Layers },
    { id: 'my-books' as const, label: 'My Books', icon: BookOpen, badge: savedBooksCount > 0 ? savedBooksCount : undefined },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-purple-100/60 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onTabChange('create')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
              <Palette className="w-5 h-5" />
            </div>
            <div className="flex items-baseline text-xl font-bold tracking-tight">
              <span className="text-slate-900 font-extrabold">ColorBook</span>
              <span className="text-purple-600 font-black ml-1 text-2xl leading-none">AI</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-purple-700 shadow-xs shadow-purple-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Area: Avatar placeholder */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm shadow-xs"
                title="Guest Creator"
              >
                GC
              </div>
              <div className="text-xs text-left hidden lg:block">
                <p className="font-semibold text-slate-800 leading-tight">Creator</p>
                <p className="text-slate-400 text-[11px]">Free Plan</p>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-purple-100 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onTabChange(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
