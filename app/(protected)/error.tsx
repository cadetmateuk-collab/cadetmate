'use client';

export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-semibold">This tool could not be loaded</h1>
      <p className="text-sm text-muted-foreground">Please try again.</p>
      <button type="button" onClick={reset} className="text-sm font-medium text-primary underline">
        Try again
      </button>
    </div>
  );
}
