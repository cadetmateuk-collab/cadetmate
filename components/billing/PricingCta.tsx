'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { SubscribeButton } from '@/components/billing/SubscribeButton';

export function PricingCta({
  isAuthenticated,
  isPremium,
  priceLabel,
}: {
  isAuthenticated: boolean;
  isPremium: boolean;
  priceLabel: string | null;
}) {
  if (isPremium) {
    return (
      <Button className="w-full mt-8" asChild>
        <Link href="/settings">
          Manage billing <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button className="w-full mt-8" asChild>
        <TrackedLink
          href="/auth?mode=signup&redirectTo=/store"
          trackLabel="pricing_get_premium"
          trackParams={{ plan: 'premium' }}
        >
          Get Premium {priceLabel ? `· ${priceLabel}` : ''} <ArrowRight className="ml-1 h-4 w-4" />
        </TrackedLink>
      </Button>
    );
  }

  return (
    <SubscribeButton
      className="w-full mt-8"
      label={priceLabel ? `Subscribe · ${priceLabel}` : 'Subscribe to Premium'}
    />
  );
}
