import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/store/EmptyState';

export default function StoreProductNotFound() {
  return (
    <div className="pb-10">
      <EmptyState
        title="We couldn't find that product"
        description="It may have been removed, or the link might be out of date."
        action={
          <Button asChild>
            <Link href="/store">Back to store</Link>
          </Button>
        }
      />
    </div>
  );
}
