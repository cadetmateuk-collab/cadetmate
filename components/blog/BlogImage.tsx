import Image from 'next/image';

function isOptimizable(src: string): boolean {
  return src.startsWith('/') || src.includes('supabase.co') || src.startsWith('https://cadetmate.co.uk');
}

export function BlogHeroImage({
  src,
  alt,
  priority = false,
  className = '',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) return null;

  if (isOptimizable(src)) {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg ${className}`} style={{ aspectRatio: '16 / 7' }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 896px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`w-full rounded-lg object-cover ${className}`}
      style={{ aspectRatio: '16 / 7' }}
    />
  );
}

export function BlogCardImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (!src) return null;

  if (isOptimizable(src)) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ height: 180 }}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`w-full object-cover ${className}`}
      style={{ height: 180 }}
    />
  );
}
