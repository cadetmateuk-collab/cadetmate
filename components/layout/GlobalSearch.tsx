'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, BookOpen, MessageSquare, FileText, Users, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200',
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline flex-1 text-left">Search</span>
        <kbd className="hidden md:inline text-[10px] font-mono bg-background border border-border rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules, flashcards, community, blog…"
                className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && query.length >= 2 && !loading && (
                <p className="px-4 py-8 text-sm text-center text-muted-foreground">No results found</p>
              )}
              {results.map((r) => {
                const Icon = TYPE_ICONS[r.type] ?? Search;
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{r.type}</span>
                  </button>
                );
              })}
              {query.length < 2 && (
                <p className="px-4 py-6 text-xs text-center text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
