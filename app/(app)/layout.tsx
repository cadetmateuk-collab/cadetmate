import { AppTopNav } from '@/components/layout/AppTopNav';
import { PageBackground } from '@/components/layout/PageBackground';
import { PageContainer } from '@/components/layout/PageContainer';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { requireAuth } from '@/lib/auth/get-user';
import { toNavUser } from '@/lib/auth/nav-user';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Training platform for maritime cadets — modules, flashcards, TRB tasks, and more.',
  path: '/',
});

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <AppTopNav user={toNavUser(user)} />
      <main className="relative flex-1 overflow-y-auto pb-16 lg:pb-0 bg-background">
        <PageBackground />
        <div className="relative z-[1] min-h-full">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>
    </div>
  );
}
