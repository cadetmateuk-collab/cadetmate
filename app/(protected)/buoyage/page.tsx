'use client';

import dynamic from 'next/dynamic';

const BuoyageApp = dynamic(() => import('@/components/buoyage/BuoyageApp'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-2.5rem)] items-center justify-center bg-slate-200 text-sm text-slate-600">
      Loading buoyage simulator…
    </div>
  ),
});

export default function BuoyagePage() {
  return <BuoyageApp />;
}
