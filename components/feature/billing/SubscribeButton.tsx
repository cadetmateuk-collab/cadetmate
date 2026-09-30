'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { redirectToPremiumCheckout } from '@/lib/stripe/client-actions';

export function SubscribeButton({
  label,
  className,
  variant = 'default',
}: {
  label?: string;
  className?: string;
  variant?: 'default' | 'outline';
}) {
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      await redirectToPremiumCheckout();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Button className={className} variant={variant} onClick={subscribe} disabled={loading}>
      {loading ? 'Redirecting…' : label ?? 'Subscribe to Premium'}
    </Button>
  );
}
