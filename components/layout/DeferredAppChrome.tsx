'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const SupportWidget = dynamic(() => import('@/components/SupportWidget'), {
  ssr: false,
});

const HIDE_WIDGET_PREFIXES = [
  '/home',
  '/pricing',
  '/about',
  '/contact',
  '/resources',
  '/free-content',
  '/community-preview',
  '/partners',
];

/**
 * Defers non-critical client chrome until after first paint / idle.
 * Marketing routes never load the support widget chunk.
 */
export function DeferredAppChrome() {
  const pathname = usePathname() ?? '';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(enable, { timeout: 3000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(enable, 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;

  const hideSupport = HIDE_WIDGET_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hideSupport) return null;

  return <SupportWidget />;
}
