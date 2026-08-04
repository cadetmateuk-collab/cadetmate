import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { PageBackground } from '@/components/layout/PageBackground';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = buildNoIndexMetadata('Sign In', '/auth');

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <PageBackground />
      <PageContainer className="relative z-[1] min-h-screen flex items-center justify-center py-8">
        {children}
      </PageContainer>
    </div>
  );
}
