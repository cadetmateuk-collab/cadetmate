import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { requirePremium } from '@/lib/auth/get-user';
import { ProtectedToolBar } from '@/components/layout/ProtectedToolBar';

export const metadata: Metadata = buildNoIndexMetadata('Emergency Simulator', '/simulator');

export default async function SimulatorLayout({ children }: { children: React.ReactNode }) {
  await requirePremium();

  return (
    <>
      <ProtectedToolBar title="Emergency Simulator" backHref="/practice" backLabel="Back to Practice" />
      <div className="pt-10">{children}</div>
    </>
  );
}
