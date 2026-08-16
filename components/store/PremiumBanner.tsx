import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillingPortalButton } from '@/components/billing/BillingPortalButton';
import type { PremiumPrice } from '@/lib/stripe/premium-price';

export function PremiumBanner({
  isPremium,
  price,
}: {
  isPremium: boolean;
  price: PremiumPrice | null;
}) {
  return (
    <aside
      className="mb-8 flex flex-col gap-4 rounded-lg border border-brass/25 bg-brass/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-labelledby="premium-banner-heading"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brass/15">
          <Sparkles className="h-4 w-4 text-brass" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 id="premium-banner-heading" className="text-sm font-semibold tracking-tight text-foreground">
            {isPremium ? 'Premium is active' : 'Unlock more with Premium'}
          </h2>
          <p className="mt-0.5 text-caption text-muted-foreground">
            {isPremium
              ? 'You have access to premium study features, modules, orals and simulators. Flashcard packs are still sold separately below.'
              : 'Get access to premium study features, resources and exclusive content designed to help you get more from the app.'}
            {!isPremium && price?.formattedWithInterval ? (
              <span className="mt-0.5 block font-medium text-foreground/80">
                From {price.formattedWithInterval}
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">
        {isPremium ? (
          <BillingPortalButton className="w-full sm:w-auto">Manage billing</BillingPortalButton>
        ) : (
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/pricing">Explore Premium</Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
