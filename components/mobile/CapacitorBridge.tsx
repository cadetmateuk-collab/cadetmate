'use client';

import { useEffect } from 'react';

/**
 * Registers Android back-button + deep-link handling when the Next app
 * is loaded inside the Capacitor shell (server.url → live site).
 */
export function CapacitorBridge() {
  useEffect(() => {
    let dispose: (() => void) | undefined;

    (async () => {
      try {
        const core = await import('@capacitor/core');
        if (!core.Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');

        const backSub = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack || window.history.length > 1) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        const urlSub = await App.addListener('appUrlOpen', ({ url }) => {
          try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
              const parsed = new URL(url);
              window.location.assign(parsed.pathname + parsed.search + parsed.hash);
              return;
            }
            // cadetmate://path?query → /path?query
            const withoutScheme = url.replace(/^[a-z]+:\/\//i, '/').replace(/^\/\//, '/');
            const path = withoutScheme.startsWith('/') ? withoutScheme : `/${withoutScheme}`;
            window.location.assign(path);
          } catch {
            console.warn('[CapacitorBridge] Unhandled deep link', url);
          }
        });

        dispose = () => {
          backSub.remove();
          urlSub.remove();
        };
      } catch {
        /* Not running under Capacitor or packages not installed in this build */
      }
    })();

    return () => dispose?.();
  }, []);

  return null;
}
