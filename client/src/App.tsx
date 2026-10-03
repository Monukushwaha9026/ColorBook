import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CreatePage } from './pages/CreatePage';
import { ExamplesPage } from './pages/ExamplesPage';
import { MyBooksPage } from './pages/MyBooksPage';
import { api } from './lib/api';
import type { Book } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'examples' | 'my-books'>('create');
  const [prefilledPrompt, setPrefilledPrompt] = useState<string>('');
  const [reopenedBook, setReopenedBook] = useState<Book | null>(null);
  const [savedBooksCount, setSavedBooksCount] = useState<number>(0);

  const refreshBookCount = useCallback(async () => {
    try {
      const res = await api.listBooks();
      setSavedBooksCount(res.books?.length || 0);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    refreshBookCount();
  }, [refreshBookCount, activeTab]);

  const handleUsePrompt = (promptText: string) => {
    setReopenedBook(null);
    setPrefilledPrompt(promptText);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBook = (book: Book) => {
    setReopenedBook(book);
    setPrefilledPrompt('');
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewBook = () => {
    setReopenedBook(null);
    setPrefilledPrompt('');
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMyBooks = () => {
    setReopenedBook(null);
    setActiveTab('my-books');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-purple-200 selection:text-purple-900">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'create' && activeTab !== 'create') {
            // If clicking Create from another tab, reset reopened book to start fresh unless user is already editing
            setReopenedBook(null);
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedBooksCount={savedBooksCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'create' && (
          <CreatePage
            key={reopenedBook ? `reopen_${reopenedBook.id}` : `new_${prefilledPrompt}`}
            initialPrompt={prefilledPrompt}
            initialBook={reopenedBook}
            onSaveBook={() => refreshBookCount()}
            onBackToMyBooks={reopenedBook ? handleBackToMyBooks : undefined}
            onResetToNew={handleStartNewBook}
          />
        )}

        {activeTab === 'examples' && (
          <ExamplesPage onUsePrompt={handleUsePrompt} />
        )}

        {activeTab === 'my-books' && (
          <MyBooksPage
            onOpenBook={handleOpenBook}
            onCreateClick={handleStartNewBook}
          />
        )}
      </main>

      {/* Application Footer */}
      <Footer />
    </div>
  );
};

export default App;
