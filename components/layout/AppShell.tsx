import { AppTopNav } from '@/components/layout/AppTopNav';
import { PageBackground } from '@/components/layout/PageBackground';
import { PageContainer } from '@/components/layout/PageContainer';
import { SkipLink } from '@/components/a11y/SkipLink';
import { PageTransition } from '@/components/motion/PageTransition';
import type { NavUser } from '@/lib/auth/nav-user';

/** Logged-in app chrome — header, dotted background, scrollable main */
export function AppShell({
  user,
  children,
}: {
  user: NavUser;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen w-full flex-col">
      <SkipLink />
      <PageBackground />
      <AppTopNav user={user} />
      <main
        id="main-content"
        tabIndex={-1}
        className="cm-scroll relative z-[1] min-h-0 flex-1 pb-16 lg:pb-0 outline-none"
      >
        <div className="min-h-full">
          <PageContainer>
            <PageTransition>{children}</PageTransition>
          </PageContainer>
        </div>
      </main>
    </div>
  );
}
