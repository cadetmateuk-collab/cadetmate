import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PageBackground } from './PageBackground';
import { PageContainer } from './PageContainer';
import { SkipLink } from '@/components/a11y/SkipLink';
import { PageTransition } from '@/components/motion/PageTransition';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SkipLink />
      <PageBackground />
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="relative z-[1] flex-1 outline-none">
        <div className="min-h-full">
          <PageContainer>
            <PageTransition>{children}</PageTransition>
          </PageContainer>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
