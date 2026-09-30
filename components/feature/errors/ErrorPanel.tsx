'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ErrorPanel({
  title,
  description,
  reset,
}: {
  title: string;
  description: string;
  reset?: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">CadetMate</p>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground max-w-md leading-relaxed">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {reset ? (
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        ) : null}
        <Button variant={reset ? 'outline' : 'default'} asChild>
          <Link href="/home">Back to Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}
