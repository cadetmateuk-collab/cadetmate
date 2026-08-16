import { Button } from '@/components/ui/button';
import { CompassWatermark } from '@/components/icons/MaritimeIcons';

export function StoreHeader({
  onBrowseDigital,
  onBrowsePhysical,
}: {
  onBrowseDigital: () => void;
  onBrowsePhysical: () => void;
}) {
  return (
    <header className="relative mb-8 overflow-hidden">
      <div className="pointer-events-none absolute -right-4 -top-6 hidden h-40 w-40 text-primary md:block" aria-hidden>
        <CompassWatermark className="h-full w-full" />
      </div>
      <p className="text-label font-semibold uppercase tracking-wider text-primary">Store</p>
      <h1 className="mt-2 max-w-xl text-balance text-h1 font-extrabold tracking-tight">
        Resources to help you study smarter.
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-body">
        Get digital study resources that unlock instantly in the app, or browse physical products you can order.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={onBrowseDigital}>
          Browse digital resources
        </Button>
        <Button type="button" variant="outline" onClick={onBrowsePhysical}>
          Shop physical products
        </Button>
      </div>
    </header>
  );
}
