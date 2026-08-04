import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '@/lib/security/env';

/**
 * Mirrors the auth → protected-route redirect contract used by
 * auth-form + middleware + get-user.
 */
describe('auth redirect journey (integration)', () => {
  const cases = [
    { next: '/dashboard', expected: '/dashboard' },
    { next: '/buoyage', expected: '/buoyage' },
    { next: '/flashcards/colregs', expected: '/flashcards/colregs' },
    { next: 'https://evil.test', expected: '/dashboard' },
    { next: '//evil.test', expected: '/dashboard' },
  ] as const;

  it.each(cases)(
    'maps redirectTo=$next → $expected',
    ({ next, expected }) => {
      expect(safeRedirectPath(next)).toBe(expected);
    },
  );

  it('preserves deep links after login bounce', () => {
    const attempted = '/trb?task=17b';
    const bounce = `/auth?redirectTo=${encodeURIComponent(attempted)}`;
    const params = new URL(bounce, 'https://cadetmate.co.uk').searchParams;
    expect(safeRedirectPath(params.get('redirectTo'))).toBe(attempted);
  });
});
