/** Pure helpers for Stripe webhook ledger + pack grant rows. */

export function isDuplicateStripeEventError(code: string | undefined): boolean {
  return code === '23505';
}

export function packOwnershipGrantRow(opts: {
  userId: string;
  packId: string;
  sessionId: string;
}) {
  return {
    user_id: opts.userId,
    pack_id: opts.packId,
    source: 'stripe' as const,
    stripe_session_id: opts.sessionId,
  };
}
