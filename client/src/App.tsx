import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CreatePage } from './pages/CreatePage';
import { ExamplesPage } from './pages/ExamplesPage';
import { MyBooksPage } from './pages/MyBooksPage';
import { MOCK_SAVED_BOOKS } from './data/mockData';
import type { Book } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'examples' | 'my-books'>('create');
  const [savedBooks, setSavedBooks] = useState<Book[]>(MOCK_SAVED_BOOKS);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string>('');

  const handleSaveBook = (book: Book) => {
    setSavedBooks((prev) => [book, ...prev]);
  };

  const handleDeleteBook = (id: string) => {
    setSavedBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUsePrompt = (promptText: string) => {
    setPrefilledPrompt(promptText);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-purple-200 selection:text-purple-900">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedBooksCount={savedBooks.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'create' && (
          <CreatePage
            key={prefilledPrompt}
            initialPrompt={prefilledPrompt}
            onSaveBook={handleSaveBook}
          />
        )}

        {activeTab === 'examples' && (
          <ExamplesPage onUsePrompt={handleUsePrompt} />
        )}

        {activeTab === 'my-books' && (
          <div className="flex flex-col">
            {/* Quick Demo Switcher Bar to test Empty State vs Populated State easily */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex justify-end">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs shadow-2xs">
                <span className="text-slate-500 font-medium">Demo State:</span>
                <button
                  type="button"
                  onClick={() => setSavedBooks([])}
                  className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                    savedBooks.length === 0
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:text-purple-600'
                  }`}
                >
                  Empty View (0)
                </button>
                <button
                  type="button"
                  onClick={() => setSavedBooks(MOCK_SAVED_BOOKS)}
                  className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                    savedBooks.length > 0
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:text-purple-600'
                  }`}
                >
                  Populated View ({MOCK_SAVED_BOOKS.length})
                </button>
              </div>
            </div>

            <MyBooksPage
              books={savedBooks}
              onCreateClick={() => setActiveTab('create')}
              onDeleteBook={handleDeleteBook}
            />
          </div>
        )}
      </main>

      {/* Application Footer */}
      <Footer />
    </div>
  );
};

export default App;
