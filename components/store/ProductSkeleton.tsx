import { cn } from '@/lib/utils';

export function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
      aria-hidden="true"
    >
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded-sm bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-sm bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded-sm bg-muted" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="h-4 w-14 animate-pulse rounded-sm bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function StorePageSkeleton() {
  return (
    <div className="pb-10">
      <div className="mb-8 max-w-xl space-y-3">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-muted" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
        <div className="flex gap-2 pt-2">
          <div className="h-11 w-44 animate-pulse rounded-md bg-muted" />
          <div className="h-11 w-40 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="mb-8 h-[4.5rem] animate-pulse rounded-lg bg-muted" />
      <div className="mb-6 h-11 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
      <ProductSkeletonGrid />
    </div>
  );
}
