'use client';

import type { FeedSort, TopPeriod } from '@/lib/community/types';
import { cn } from '@/lib/utils';

interface FeedFiltersProps {
  sort: FeedSort;
  period: TopPeriod;
  category?: string;
  categories: { slug: string; name: string; color: string | null }[];
  onSortChange: (sort: FeedSort) => void;
  onPeriodChange: (period: TopPeriod) => void;
  onCategoryChange: (category: string | undefined) => void;
}

const SORTS: { value: FeedSort; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
];

const PERIODS: { value: TopPeriod; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All Time' },
];

export function FeedFilters({
  sort,
  period,
  category,
  categories,
  onSortChange,
  onPeriodChange,
  onCategoryChange,
}: FeedFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onSortChange(s.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              sort === s.value
                ? 'bg-primary text-white'
                : 'bg-card text-muted-foreground border border-border hover:border-primary/40',
            )}
          >
            {s.label}
          </button>
        ))}
        {sort === 'top' && (
          <div className="flex gap-1 ml-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPeriodChange(p.value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  period === p.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => onCategoryChange(undefined)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            !category
              ? 'bg-primary text-white'
              : 'bg-card text-muted-foreground border border-border',
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onCategoryChange(cat.slug)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              category === cat.slug
                ? 'text-white'
                : 'bg-card text-muted-foreground border border-border',
            )}
            style={category === cat.slug ? { backgroundColor: cat.color ?? 'hsl(var(--primary))' } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
