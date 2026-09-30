'use client';

import { ErrorPanel } from '@/components/feature/errors/ErrorPanel';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      title="Something went off course"
      description="This page could not be loaded. Try again, or head back to the homepage."
      reset={reset}
    />
  );
}
