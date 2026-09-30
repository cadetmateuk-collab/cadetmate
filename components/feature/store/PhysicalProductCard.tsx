import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { ProductCover } from './ProductCover';
import { formatGbp } from './format';
import type { PhysicalProduct } from './types';

export function PhysicalProductCard({ product }: { product: PhysicalProduct }) {
  return (
    <ProductCard>
      <Link
        href={`/store/${product.slug}`}
        className="flex min-h-0 flex-1 flex-col text-inherit hover:text-inherit focus-visible:outline-none"
      >
        <div className="relative shrink-0">
          <ProductCover
            src={product.image_url}
            alt={`${product.name} product photo`}
            title={product.name}
            className="bg-muted"
          />
          <div className="absolute left-2.5 top-2.5">
            <span className="badge bg-card/95 text-foreground shadow-xs backdrop-blur-sm">
              Physical
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <p className="h-4 truncate text-label font-semibold uppercase tracking-wide text-muted-foreground">
            {product.category || '\u00a0'}
          </p>
          <h3 className="mt-1 line-clamp-2 h-[2.5rem] text-sm font-semibold leading-snug tracking-tight text-foreground sm:h-[2.625rem] sm:text-[0.9375rem]">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 h-[2.5rem] text-caption leading-snug text-muted-foreground">
            {product.description || '\u00a0'}
          </p>
          <p className="mt-2 h-4 truncate text-caption text-muted-foreground">
            {product.variants && product.variants.length > 0
              ? `${product.variants.length} ${product.variants.length === 1 ? 'option' : 'options'}`
              : '\u00a0'}
          </p>
          <div className="mt-3 flex h-10 shrink-0 items-center justify-between gap-2">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatGbp(product.price_cents)}
            </p>
            <span
              aria-hidden
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'hidden min-h-10 shrink-0 motion-safe:group-hover:border-primary/50 sm:inline-flex',
              )}
            >
              View product
            </span>
          </div>
        </div>
      </Link>
    </ProductCard>
  );
}
