import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/seo/schema';

export function Breadcrumbs({ items, centered = true }: { items: BreadcrumbItem[]; centered?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-5${centered ? ' text-center' : ''}`}>
      <ol className={`flex flex-wrap items-center gap-1 text-xs text-muted-foreground/70${centered ? ' justify-center' : ''}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1 min-w-0">
              {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden />}
              {isLast ? (
                <span className="truncate text-muted-foreground/80" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-muted-foreground transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
