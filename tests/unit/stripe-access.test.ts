import { describe, expect, it } from 'vitest';
import {
  checkoutIsPremium,
  parsePremiumPriceIds,
  sessionPaid,
} from '@/lib/stripe/access';
import {
  isDuplicateStripeEventError,
  packOwnershipGrantRow,
} from '@/lib/stripe/webhook-ledger';

describe('sessionPaid', () => {
  it('accepts paid and no_payment_required only', () => {
    expect(sessionPaid('paid')).toBe(true);
    expect(sessionPaid('no_payment_required')).toBe(true);
    expect(sessionPaid('unpaid')).toBe(false);
    expect(sessionPaid('complete')).toBe(false);
    expect(sessionPaid(undefined)).toBe(false);
  });
});

describe('parsePremiumPriceIds', () => {
  it('merges primary and extras', () => {
    expect(parsePremiumPriceIds('price_a', 'price_b, price_c')).toEqual([
      'price_a',
      'price_b',
      'price_c',
    ]);
  });
});

describe('pack grant + webhook ledger', () => {
  it('includes stripe_session_id for paid pack ownership', () => {
    expect(
      packOwnershipGrantRow({
        userId: 'user_1',
        packId: 'pack_1',
        sessionId: 'cs_test_123',
      }),
    ).toEqual({
      user_id: 'user_1',
      pack_id: 'pack_1',
      source: 'stripe',
      stripe_session_id: 'cs_test_123',
    });
  });

  it('treats unique-violation as an already-processed event', () => {
    expect(isDuplicateStripeEventError('23505')).toBe(true);
    expect(isDuplicateStripeEventError('23503')).toBe(false);
    expect(isDuplicateStripeEventError(undefined)).toBe(false);
  });
});

describe('checkoutIsPremium', () => {
  it('rejects pack checkouts even if a premium price is present', () => {
    expect(
      checkoutIsPremium({
        packId: 'pack_1',
        linePriceIds: ['price_premium'],
        allowedPriceIds: ['price_premium'],
      }),
    ).toBe(false);
  });

  it('requires an allowlisted line-item price', () => {
    expect(
      checkoutIsPremium({
        packId: null,
        linePriceIds: ['price_other'],
        allowedPriceIds: ['price_premium'],
      }),
    ).toBe(false);
    expect(
      checkoutIsPremium({
        packId: null,
        linePriceIds: ['price_premium'],
        allowedPriceIds: ['price_premium'],
      }),
    ).toBe(true);
  });

  it('does not grant premium when no prices are configured', () => {
    expect(
      checkoutIsPremium({
        packId: null,
        linePriceIds: ['price_anything'],
        allowedPriceIds: [],
      }),
    ).toBe(false);
  });
});
