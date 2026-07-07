'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function HashScrollSync() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [searchParams]);

  return null;
}
