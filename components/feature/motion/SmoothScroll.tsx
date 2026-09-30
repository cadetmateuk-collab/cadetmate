'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

function scrollToId(id: string, smooth: boolean) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  return true;
}

/**
 * Same-page hash links (including Next.js <Link href="#…">) scroll smoothly.
 * Respects prefers-reduced-motion.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    const raw = window.location.hash.slice(1);
    if (!raw) return;
    let cancelled = false;
    const id = decodeURIComponent(raw);
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) scrollToId(id, !reduce);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, reduce]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#' || !href.includes('#')) return;

      const url = new URL(href, window.location.href);
      if (url.pathname !== window.location.pathname) return;

      const id = decodeURIComponent(url.hash.slice(1));
      if (!id) return;

      if (scrollToId(id, !reduce)) {
        event.preventDefault();
        if (url.hash !== window.location.hash) {
          history.pushState(null, '', `${pathname}${url.hash}`);
        }
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, reduce]);

  return null;
}
