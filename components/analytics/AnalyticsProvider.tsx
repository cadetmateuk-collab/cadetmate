'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  GA_MEASUREMENT_ID,
  trackPageView,
  trackException,
} from '@/lib/analytics';

/**
 * Loads gtag via DOM (avoids React 19 client <script> warnings from next/script)
 * and reports App Router navigations + global JS errors.
 */
export function AnalyticsProvider({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const w = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };

    w.dataLayer = w.dataLayer || [];
    if (typeof w.gtag !== 'function') {
      w.gtag = function gtag(...args: unknown[]) {
        w.dataLayer!.push(args);
      };
      w.gtag('js', new Date());
      w.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
        anonymize_ip: true,
      });
    }

    if (!document.getElementById('ga4-src')) {
      const s = document.createElement('script');
      s.id = 'ga4-src';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || '/';
    trackPageView(path);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const onError = (event: ErrorEvent) => {
      trackException(event.message || 'Unhandled error', true, {
        source: event.filename,
        line: event.lineno,
        col: event.colno,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? 'Unhandled rejection');
      trackException(reason, false, { type: 'unhandledrejection' });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return <>{children}</>;
}
