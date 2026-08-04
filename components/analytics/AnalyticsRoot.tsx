'use client';

import { Suspense } from 'react';
import { AnalyticsProvider } from './AnalyticsProvider';

/** Suspense boundary required for useSearchParams in App Router. */
export function AnalyticsRoot({ children }: { children?: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </Suspense>
  );
}
