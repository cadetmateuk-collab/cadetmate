/** Shared motion tokens — prefer CSS transforms/opacity for 60fps. */

export const MOTION = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    base: 0.22,
    slow: 0.35,
  },
  /** cubic-bezier(0.22, 1, 0.36, 1) — snappy ease-out */
  easeCss: 'cubic-bezier(0.22, 1, 0.36, 1)',
  ease: [0.22, 1, 0.36, 1] as const,
  pageY: 8,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
