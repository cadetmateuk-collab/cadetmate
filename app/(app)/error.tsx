'use client';

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">Please try again. If this keeps happening, contact support.</p>
      <button type="button" onClick={reset} className="text-sm font-medium text-primary underline">
        Try again
      </button>
    </div>
  );
}
