import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LEGAL_DISCLAIMER } from '@/lib/legal/company';

export function LegalDisclaimer() {
  return (
    <Alert className="mb-8 border-amber-500/40 bg-amber-50 text-foreground dark:bg-amber-950/30">
      <AlertTitle>Legal review required</AlertTitle>
      <AlertDescription>{LEGAL_DISCLAIMER}</AlertDescription>
    </Alert>
  );
}

export function LegalDocument({
  eyebrow,
  title,
  intro,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl py-12 sm:py-16">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">{eyebrow}</p>
      ) : null}
      <h1 className="text-h1 font-bold tracking-tight text-balance">{title}</h1>
      <p className="text-muted-foreground mt-3 leading-relaxed">{intro}</p>
      <p className="text-xs text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
      <div className="mt-8">
        <LegalDisclaimer />
      </div>
      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-0 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-primary [&_a]:hover:underline [&_strong]:text-foreground [&_strong]:font-medium">
        {children}
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        Questions?{' '}
        <Link href="/contact" className="text-primary hover:underline">
          Contact us
        </Link>
        {' · '}
        <Link href="/faq" className="text-primary hover:underline">
          FAQ
        </Link>
      </p>
    </article>
  );
}
