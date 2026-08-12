'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_KEY = 'cm_analytics_sid';

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Lightweight first-party page view beacon — skips admin routes. */
export function SiteAnalyticsBeacon() {
  const pathname = usePathname();
  const enteredAt = useRef<number>(Date.now());
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();
    const prev = lastPath.current;
    const started = enteredAt.current;
    enteredAt.current = Date.now();
    lastPath.current = pathname;

    if (prev) {
      const durationMs = Date.now() - started;
      void fetch('/api/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: prev,
          sessionId,
          durationMs,
          referrer: document.referrer || null,
          screen: `${window.screen.width}x${window.screen.height}`,
        }),
        keepalive: true,
      }).catch(() => {});
    }

    void fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        sessionId,
        referrer: document.referrer || null,
        screen: `${window.screen.width}x${window.screen.height}`,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
