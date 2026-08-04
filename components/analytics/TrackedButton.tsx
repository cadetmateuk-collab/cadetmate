'use client';

import { forwardRef } from 'react';
import { trackClick } from '@/lib/analytics';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Analytics label (defaults to text content / aria-label). */
  trackLabel?: string;
  trackParams?: Record<string, string | number | boolean | null | undefined>;
};

/**
 * Button that reports clicks to GA4. Use for important CTAs.
 */
export const TrackedButton = forwardRef<HTMLButtonElement, Props>(
  function TrackedButton(
    { trackLabel, trackParams, onClick, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        {...rest}
        onClick={(e) => {
          const label =
            trackLabel ||
            (typeof children === 'string' ? children : undefined) ||
            rest['aria-label'] ||
            'button';
          trackClick(label, trackParams);
          onClick?.(e);
        }}
      >
        {children}
      </button>
    );
  },
);
