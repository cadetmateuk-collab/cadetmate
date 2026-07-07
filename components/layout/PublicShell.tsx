import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PageBackground } from './PageBackground';
import { PageContainer } from './PageContainer';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="relative flex-1 bg-background">
        <PageBackground />
        <div className="relative z-[1] min-h-full">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
