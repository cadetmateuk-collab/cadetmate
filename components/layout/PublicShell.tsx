import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PageBackground } from './PageBackground';
import { PageContainer } from './PageContainer';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PageBackground />
      <PublicHeader />
      <main className="relative z-[1] flex-1">
        <div className="min-h-full">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
