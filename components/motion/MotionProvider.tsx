'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Global Framer Motion config — respects OS reduced-motion and keeps
 * layout animations off the main thread where possible.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'tween', duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
