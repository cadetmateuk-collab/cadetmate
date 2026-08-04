'use client';

import Link from 'next/link';
import { trackClick } from '@/lib/analytics';

type Props = React.ComponentProps<typeof Link> & {
  trackLabel?: string;
  trackParams?: Record<string, string | number | boolean | null | undefined>;
};

/** Link that reports navigation clicks (marketing CTAs, key journeys). */
export function TrackedLink({
  trackLabel,
  trackParams,
  onClick,
  children,
  ...rest
}: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        const href = typeof rest.href === 'string' ? rest.href : '';
        trackClick(trackLabel || href || 'link', {
          link_url: href,
          ...trackParams,
        });
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
