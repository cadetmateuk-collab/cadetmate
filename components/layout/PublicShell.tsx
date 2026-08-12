'use client';

import { useState } from 'react';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageContainer } from '@/components/layout/PageContainer';
import { SkipLink } from '@/components/a11y/SkipLink';
import { PageTransition } from '@/components/motion/PageTransition';

/** Public chrome — sticky sidebar + top bar; page scrolls */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-[#F5F7FB]">
      <SkipLink />
      <MainSidebar
        variant="public"
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          variant="public"
          onOpenSidebar={() => setMobileOpen(true)}
        />
        <main id="main-content" tabIndex={-1} className="relative flex-1 outline-none">
          <div className="w-full py-6 pb-10 md:py-8">
            <PageContainer>
              <PageTransition>{children}</PageTransition>
            </PageContainer>
          </div>
          <PublicFooter />
        </main>
      </div>
    </div>
  );
}
