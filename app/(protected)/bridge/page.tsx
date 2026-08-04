'use client';

import dynamic from 'next/dynamic';

const ShipBridgeSimulator = dynamic(
  () => import('@/components/bridge/BridgeSimulator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-sm text-white/70">
        Loading bridge simulator…
      </div>
    ),
  },
);

export default function BridgePage() {
  return <ShipBridgeSimulator />;
}
