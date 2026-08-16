'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/store/EmptyState';

export default function StoreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pb-10">
      <EmptyState
        title="We couldn't load the store"
        description="Please try again."
        action={
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
