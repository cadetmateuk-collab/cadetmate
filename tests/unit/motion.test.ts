import { describe, expect, it } from 'vitest';
import { prefersReducedMotion, MOTION } from '@/lib/motion/constants';

describe('motion constants', () => {
  it('exposes stable duration tokens', () => {
    expect(MOTION.duration.base).toBeGreaterThan(0);
    expect(MOTION.easeCss).toContain('cubic-bezier');
  });

  it('reports reduced motion from matchMedia when available', () => {
    // jsdom default — typically false unless stubbed
    expect(typeof prefersReducedMotion()).toBe('boolean');
  });
});
