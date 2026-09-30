import Link from 'next/link';
import { Layers } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { ProductCover } from './ProductCover';
import { packPriceLabel } from './format';
import type { StorePack } from './types';

export function DigitalProductCard({
  pack,
  owned,
}: {
  pack: StorePack;
  owned: boolean;
}) {
  const href = owned ? `/flashcards/${pack.slug}` : `/store/${pack.slug}`;
  const price = packPriceLabel(pack);

  return (
    <ProductCard>
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col text-inherit hover:text-inherit focus-visible:outline-none"
      >
        <div className="relative shrink-0">
          <ProductCover
            src={pack.thumbnail_url}
            alt={`${pack.title} cover`}
            title={pack.title}
          />
          <div className="absolute left-2.5 top-2.5">
            <span className="badge bg-card/95 text-foreground shadow-xs backdrop-blur-sm">
              Digital
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <p className="h-4 truncate text-label font-semibold uppercase tracking-wide text-muted-foreground">
            Flashcard pack — {pack.category}
          </p>
          <h3 className="mt-1 line-clamp-2 h-[2.5rem] text-sm font-semibold leading-snug tracking-tight text-foreground sm:h-[2.625rem] sm:text-[0.9375rem]">
            {pack.title}
          </h3>
          <p className="mt-1 line-clamp-2 h-[2.5rem] text-caption leading-snug text-muted-foreground">
            {pack.description || '\u00a0'}
          </p>
          <p className="mt-2 flex h-4 items-center gap-1.5 truncate text-caption text-muted-foreground">
            <Layers className="h-3 w-3 shrink-0" aria-hidden />
            {pack.card_count} {pack.card_count === 1 ? 'card' : 'cards'}
            <span aria-hidden>·</span>
            Unlocks in app
          </p>
          <div className="mt-3 flex h-10 shrink-0 items-center justify-between gap-2">
            <p className="text-sm font-semibold tabular-nums text-foreground">{owned ? 'Owned' : price}</p>
            <span
              aria-hidden
              className={cn(
                buttonVariants({ size: 'sm', variant: owned ? 'default' : 'outline' }),
                'hidden min-h-10 shrink-0 sm:inline-flex',
                !owned && 'motion-safe:group-hover:border-primary/50',
              )}
            >
              {owned ? 'Study pack' : 'View details'}
            </span>
          </div>
        </div>
      </Link>
    </ProductCard>
  );
}
