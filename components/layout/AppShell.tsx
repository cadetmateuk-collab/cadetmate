import { AppTopNav } from '@/components/layout/AppTopNav';
import { PageBackground } from '@/components/layout/PageBackground';
import { PageContainer } from '@/components/layout/PageContainer';
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
      <PageBackground />
      <AppTopNav user={user} />
      <main className="relative z-[1] min-h-0 flex-1 overflow-y-auto pb-16 lg:pb-0">
        <div className="min-h-full">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>
    </div>
  );
}
