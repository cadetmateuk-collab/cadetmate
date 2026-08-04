'use client';

import { useSyncExternalStore } from 'react';
import { prefersReducedMotion } from '@/lib/motion/constants';

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

/** Reactive prefers-reduced-motion — updates if the OS setting changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    prefersReducedMotion,
    () => false,
  );
}
