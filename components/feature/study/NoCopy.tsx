'use client';

import type { HTMLAttributes, ReactNode } from 'react';

type NoCopyProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** Prevents text selection and clipboard copy on educational content. */
export function NoCopy({ children, className, ...props }: NoCopyProps) {
  return (
    <div
      className={['no-copy', className].filter(Boolean).join(' ')}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      {...props}
    >
      {children}
    </div>
  );
}
