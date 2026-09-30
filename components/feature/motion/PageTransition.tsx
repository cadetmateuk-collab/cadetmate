'use client';

import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';
import { cn } from '@/lib/utils';

/**
 * Lightweight route enter animation (CSS opacity + transform only).
 * Remounts on pathname so each navigation gets a fresh enter — layouts stay mounted.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <div
      key={pathname}
      className={cn(reduce ? undefined : 'cm-page-enter', className)}
    >
      {children}
    </div>
  );
}
