export function PostSkeleton() {
  return (
    <div className="flex gap-3 p-4 bg-card border border-border rounded-xl animate-pulse">
      <div className="w-8 h-16 bg-muted rounded-lg" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}

export function PostSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
