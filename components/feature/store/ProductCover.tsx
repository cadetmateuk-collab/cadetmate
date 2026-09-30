import { cn } from '@/lib/utils';

export function ProductCover({
  src,
  alt,
  title,
  className,
}: {
  src?: string | null;
  alt: string;
  title: string;
  className?: string;
}) {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className={cn('relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-accent', className)}>
      {src ? (
        // Thumbnail hosts vary (Supabase, CMS); avoid next/image remote allowlist gaps.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="select-none text-3xl font-extrabold tracking-tight text-primary/20 sm:text-4xl">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}
