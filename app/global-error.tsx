'use client';

import { manrope } from '@/lib/fonts';
import './globals.css';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB" className={manrope.variable}>
      <body className={manrope.className}>
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">CadetMate</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Something went off course</h1>
          <p className="mt-3 text-muted-foreground max-w-md leading-relaxed">
            The app hit an unexpected error. Try again, or return home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center h-11 px-4 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90"
            >
              Try again
            </button>
            <a
              href="/home"
              className="inline-flex items-center justify-center h-11 px-4 rounded-md border border-border text-sm font-medium hover:bg-accent"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
