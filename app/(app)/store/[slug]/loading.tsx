export default function StoreProductLoading() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Loading product">
      <div className="mb-6 h-5 w-28 animate-pulse rounded-sm bg-muted" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          <div className="h-4 w-20 animate-pulse rounded-sm bg-muted" />
          <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded-sm bg-muted" />
          <div className="mt-6 h-12 w-40 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
