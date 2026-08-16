'use client';

import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { StoreKindFilter } from './types';

export function StoreCategoryTabs({
  kind,
  onKindChange,
  subjects,
  subject,
  onSubjectChange,
  query,
  onQueryChange,
  digitalCount,
  physicalCount,
}: {
  kind: StoreKindFilter;
  onKindChange: (kind: StoreKindFilter) => void;
  subjects: string[];
  subject: string;
  onSubjectChange: (subject: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  digitalCount: number;
  physicalCount: number;
}) {
  const showSubjects = (kind === 'all' || kind === 'digital') && subjects.length > 1;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={kind}
          onValueChange={(value) => onKindChange(value as StoreKindFilter)}
          className="gap-0"
        >
          <TabsList
            className="h-11 w-full rounded-lg p-1 sm:w-auto"
            aria-label="Product type"
          >
            <TabsTrigger value="all" className="min-h-10 flex-1 px-4 sm:flex-none">
              All
            </TabsTrigger>
            <TabsTrigger value="digital" className="min-h-10 flex-1 px-4 sm:flex-none">
              Digital
              <span className="text-caption tabular-nums opacity-70">{digitalCount}</span>
            </TabsTrigger>
            <TabsTrigger value="physical" className="min-h-10 flex-1 px-4 sm:flex-none">
              Physical
              <span className="text-caption tabular-nums opacity-70">{physicalCount}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search the store…"
            aria-label="Search the store"
            className="h-11 pl-9"
          />
        </div>
      </div>

      {showSubjects && (
        <div
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5"
          role="group"
          aria-label="Filter by subject"
        >
          <SubjectChip
            label="All subjects"
            selected={subject === 'all'}
            onSelect={() => onSubjectChange('all')}
          />
          {subjects.map((name) => (
            <SubjectChip
              key={name}
              label={name}
              selected={subject === name}
              onSelect={() => onSubjectChange(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectChip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'h-9 shrink-0 rounded-md border px-3 text-caption font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        selected
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
