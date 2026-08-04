'use client';

import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

/**
 * Lightweight route enter animation (CSS opacity + transform only).
 * Remounts on pathname so each navigation gets a fresh enter — layouts stay mounted.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <div
      key={pathname}
      className={reduce ? undefined : 'cm-page-enter'}
    >
      {children}
    </div>
  );
}
