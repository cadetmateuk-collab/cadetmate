'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { redirectToBillingPortal } from '@/lib/stripe/client-actions';

export function BillingPortalButton({
  children,
  className,
  variant = 'outline',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'outline' | 'default' | 'destructive';
}) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      await redirectToBillingPortal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not open billing portal.');
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={openPortal} disabled={loading}>
      {loading ? 'Opening…' : children}
    </Button>
  );
}
