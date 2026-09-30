'use client';

import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { NAUTICAL_COLLEGES } from '@/lib/onboarding/constants';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CollegeCombobox({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [customMode, setCustomMode] = useState(
    Boolean(value) && !(NAUTICAL_COLLEGES as readonly string[]).includes(value),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...NAUTICAL_COLLEGES];
    return NAUTICAL_COLLEGES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  if (customMode) {
    return (
      <div className="space-y-3">
        <Input
          autoFocus
          value={value === 'Other' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your college name"
          className="h-12 border-2"
        />
        <button
          type="button"
          className="text-sm text-primary font-medium hover:underline"
          onClick={() => {
            setCustomMode(false);
            onChange('');
            setQuery('');
          }}
        >
          Back to college list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search colleges…"
          className="h-12 pl-10 border-2"
          aria-label="Search nautical colleges"
        />
      </div>

      <ul
        className="max-h-44 overflow-y-auto rounded-xl border border-border divide-y divide-border"
        role="listbox"
        aria-label="Nautical colleges"
      >
        {filtered.map((college) => {
          const selected = value === college;
          const isOther = college === 'Other';
          return (
            <li key={college}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm transition-colors touch-manipulation',
                  selected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60',
                )}
                onClick={() => {
                  if (isOther) {
                    setCustomMode(true);
                    onChange('');
                  } else {
                    onChange(college);
                  }
                }}
              >
                {isOther ? (
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" aria-hidden />
                    My college isn&apos;t listed
                  </span>
                ) : (
                  college
                )}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-sm text-muted-foreground text-center">
            No matches.{' '}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => {
                setCustomMode(true);
                onChange(query.trim());
              }}
            >
              Enter a custom name
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
