'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { NavUser } from '@/lib/auth/nav-user';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SkipLink } from '@/components/a11y/SkipLink';
import { PageTransition } from '@/components/motion/PageTransition';
import { cn } from '@/lib/utils';

/** `/modules/:category/:subcategory` viewer (exclude tools nested under modules/) */
function isModuleViewerPath(pathname: string) {
  if (!pathname.startsWith('/modules/')) return false;
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 3) return false;
  if (parts[2] === 'morse-receiver-quiz') return false;
  return true;
}

/** Tools that fill the main column under the header (no page padding / max-width) */
function isFullBleedToolPath(pathname: string) {
  return (
    pathname === '/radar-plotting' ||
    pathname.startsWith('/radar-plotting/')
  );
}

/** Logged-in chrome — sticky sidebar + top bar; page scrolls */
export function AppShell({
  user,
  children,
}: {
  user: NavUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const moduleViewer = isModuleViewerPath(pathname);
  const fullBleedTool = isFullBleedToolPath(pathname);
  const fillMain = moduleViewer || fullBleedTool;

  return (
    <div
      className={cn(
        'relative flex w-full bg-[#F5F7FB]',
        fillMain ? 'h-dvh overflow-hidden' : 'min-h-screen',
      )}
    >
      <SkipLink />
      <MainSidebar
        variant="app"
        user={user}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!moduleViewer && (
          <AppHeader
            variant="app"
            user={user}
            onOpenSidebar={() => setMobileOpen(true)}
          />
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'relative flex-1 outline-none',
            fillMain && 'flex min-h-0 flex-col overflow-hidden',
          )}
        >
          {fillMain ? (
            <PageTransition className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </PageTransition>
          ) : (
            <div className="w-full py-6 md:py-8 pb-10">
              <PageContainer>
                <PageTransition>{children}</PageTransition>
              </PageContainer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
