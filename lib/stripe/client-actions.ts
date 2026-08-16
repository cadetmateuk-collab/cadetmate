'use client';

type CheckoutResponse = { url?: string; error?: string };

async function parseJson(res: Response): Promise<CheckoutResponse> {
  try {
    return (await res.json()) as CheckoutResponse;
  } catch {
    return { error: `Request failed (${res.status})` };
  }
}

/** Start Premium subscription Checkout and redirect to Stripe. */
export async function redirectToPremiumCheckout(): Promise<void> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: 'premium' }),
  });
  if (res.status === 401) {
    window.location.href = `/auth?mode=signup&redirectTo=${encodeURIComponent('/store')}`;
    return;
  }
  const data = await parseJson(res);
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Could not start checkout');
  }
  window.location.href = data.url;
}

/** Start a flashcard pack Checkout session and redirect to Stripe. */
export async function redirectToPackCheckout(packId: string, slug: string): Promise<void> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, slug }),
  });
  if (res.status === 401) {
    window.location.href = `/auth?redirectTo=${encodeURIComponent(`/flashcards/${slug}`)}`;
    return;
  }
  const data = await parseJson(res);
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Could not start checkout');
  }
  window.location.href = data.url;
}

/** Open the Stripe Customer Portal for payment method / invoices / cancel. */
export async function redirectToBillingPortal(): Promise<void> {
  const res = await fetch('/api/billing-portal', { method: 'POST' });
  if (res.status === 401) {
    window.location.href = '/auth';
    return;
  }
  const data = await parseJson(res);
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Could not open billing portal');
  }
  window.location.href = data.url;
}
