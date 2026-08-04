'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, BookOpen, MessageSquare, FileText, Users, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';

type SearchResult = {
  id: string;
  type: 'module' | 'flashcard' | 'post' | 'blog' | 'question' | 'simulator' | 'trb' | 'user';
  title: string;
  subtitle?: string;
  href: string;
};

const TYPE_ICONS = {
  module: BookOpen,
  flashcard: BookOpen,
  post: MessageSquare,
  blog: FileText,
  question: FileText,
  simulator: Zap,
  trb: FileText,
  user: Users,
};

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  module: 'Module',
  flashcard: 'Flashcards',
  post: 'Community',
  blog: 'Article',
  question: 'Question',
  simulator: 'Simulator',
  trb: 'TRB',
  user: 'Profile',
};

export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  useFocusTrap(open, dialogRef, inputRef);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();

    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (!controller.signal.aborted) {
        setResults(data.results ?? []);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!controller.signal.aborted) setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 120);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
      abortRef.current?.abort();
      setQuery('');
      setResults([]);
      setLoading(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const trimmed = query.trim();
  const showEmpty = trimmed.length >= 2 && !loading && results.length === 0;
  const showHint = trimmed.length < 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search CadetMate"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex items-center justify-center gap-2 h-11 min-h-11 min-w-11 px-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline text-[13px] font-medium">Search</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Close search"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search CadetMate"
            className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[min(90dvh,40rem)] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          >
            <div className="p-5 sm:p-6 pb-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 min-h-12 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                <label htmlFor="global-search-input" className="sr-only">
                  Search modules, flashcards, and articles
                </label>
                <input
                  id="global-search-input"
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search modules, flashcards, articles…"
                  className="flex-1 min-w-0 border-0 bg-transparent text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0 touch-manipulation"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-border">
              {showHint && (
                <p className="px-5 sm:px-6 py-8 text-sm text-center text-muted-foreground">
                  Start typing to search across CadetMate
                </p>
              )}

              {showEmpty && (
                <p className="px-5 sm:px-6 py-8 text-sm text-center text-muted-foreground">
                  No results for &ldquo;{trimmed}&rdquo;
                </p>
              )}

              {results.length > 0 && (
                <ul className="max-h-[min(50vh,320px)] overflow-y-auto py-2">
                  {results.map((r) => {
                    const Icon = TYPE_ICONS[r.type] ?? Search;
                    return (
                      <li key={`${r.type}-${r.id}`}>
                        <button
                          type="button"
                          onClick={() => handleSelect(r.href)}
                          className="w-full flex items-center gap-3 px-5 sm:px-6 py-3 min-h-12 text-left hover:bg-muted/50 transition-colors touch-manipulation"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                            {r.subtitle && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{r.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
                            {TYPE_LABELS[r.type]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
