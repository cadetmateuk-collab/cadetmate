import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Sign In', '/auth');

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-10 overflow-hidden bg-background"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </div>
  );
}
