/** Pure Stripe access helpers — safe to unit-test without network I/O. */

export function sessionPaid(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === 'paid' || paymentStatus === 'no_payment_required';
}

export function checkoutIsPremium(opts: {
  packId?: string | null;
  linePriceIds: string[];
  allowedPriceIds: Iterable<string>;
}): boolean {
  if (opts.packId) return false;
  const allowed = new Set(Array.from(opts.allowedPriceIds).filter(Boolean));
  if (allowed.size === 0) return false;
  return opts.linePriceIds.some((id) => allowed.has(id));
}

export function parsePremiumPriceIds(primary?: string | null, extrasCsv?: string | null): string[] {
  const ids = new Set<string>();
  const main = primary?.trim();
  if (main) ids.add(main);
  for (const part of (extrasCsv ?? '').split(',')) {
    const trimmed = part.trim();
    if (trimmed) ids.add(trimmed);
  }
  return [...ids];
}
