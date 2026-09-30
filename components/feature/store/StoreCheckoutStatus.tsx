'use client';

import { CheckCircle2 } from 'lucide-react';

export function StoreCheckoutStatus({
  activating,
  confirmError,
  showSuccess,
  onRetry,
}: {
  activating: boolean;
  confirmError: string | null;
  showSuccess: boolean;
  onRetry: () => void;
}) {
  if (!activating && !confirmError && !showSuccess) return null;

  return (
    <div className="mb-6 space-y-3">
      {activating && (
        <div
          role="status"
          className="rounded-lg border border-amber-signal/30 bg-amber-signal-light px-4 py-3 text-sm text-amber-signal dark:bg-amber-signal/15"
        >
          Confirming your Premium subscription…
        </div>
      )}
      {confirmError && (
        <div
          role="alert"
          className="rounded-lg border border-port/30 bg-port-light px-4 py-3 text-sm text-port dark:bg-port/15"
        >
          <p>{confirmError}</p>
          <button
            type="button"
            className="mt-2 min-h-11 font-semibold underline-offset-2 hover:underline"
            onClick={onRetry}
          >
            Retry confirmation
          </button>
        </div>
      )}
      {showSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-starboard/30 bg-starboard-light px-4 py-3 text-sm text-starboard dark:bg-starboard/15"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Premium is active on your account.
        </div>
      )}
    </div>
  );
}
