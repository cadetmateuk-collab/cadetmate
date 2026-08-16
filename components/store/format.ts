export function formatGbp(cents: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(cents / 100);
}

export function packPriceLabel(pack: { price_cents: number }): string {
  if (!pack.price_cents) return 'Free';
  return formatGbp(pack.price_cents);
}

export function difficultyLabel(value?: string | null): string | null {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
