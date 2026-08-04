'use client';

import dynamic from 'next/dynamic';

const InstructorDashboard = dynamic(() => import('./InstructorClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Loading instructor dashboard…
    </div>
  ),
});

export default function InstructorPage() {
  return <InstructorDashboard />;
}
