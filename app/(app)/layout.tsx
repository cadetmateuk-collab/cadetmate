import { CadetMateSidebar } from '@/components/Sidebar';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Training platform for maritime cadets — modules, flashcards, TRB tasks, and more.',
  path: '/',
});

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <CadetMateSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:pt-0">
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
