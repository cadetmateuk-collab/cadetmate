import { cn } from '@/lib/utils';

export function ProductCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'group flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card',
        'transition-[box-shadow,border-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'motion-safe:hover:shadow-card-hover hover:border-primary/20',
        'has-[:focus-visible]:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
        className,
      )}
    >
      {children}
    </article>
  );
}
