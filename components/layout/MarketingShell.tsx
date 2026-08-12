'use client';

import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SkipLink } from '@/components/a11y/SkipLink';
import { PAGE_SHELL_CLASS } from '@/components/layout/PageContainer';
import { cn } from '@/lib/utils';

/** Marketing / landing chrome — header + footer, no app sidebar. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background">
      <SkipLink />
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="relative flex-1 outline-none">
        <div className={cn(PAGE_SHELL_CLASS, 'pb-10 pt-2')}>{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
