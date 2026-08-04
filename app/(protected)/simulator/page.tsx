'use client';

import dynamic from 'next/dynamic';

const ShipBridgeSimulator = dynamic(() => import('./SimulatorClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-sm text-white/70">
      Loading emergency simulator…
    </div>
  ),
});

export default function SimulatorPage() {
  return <ShipBridgeSimulator />;
}
