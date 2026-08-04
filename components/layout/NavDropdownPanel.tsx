'use client';

import { cn } from '@/lib/utils';

export const DROPDOWN_PANEL_CLASS =
  'absolute top-full left-0 mt-2 w-56 rounded-lg py-1.5 z-[100] ' +
  'bg-card border border-border ' +
  'shadow-nav ' +
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200';

export function NavDropdownPanel({
  children,
  className,
  align = 'left',
  id,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  id?: string;
  role?: React.AriaRole;
}) {
  return (
    <div
      id={id}
      role={role}
      className={cn(
        DROPDOWN_PANEL_CLASS,
        align === 'right' && 'left-auto right-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function NavDropdownItem({
  children,
  onClick,
  className,
  role,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  className?: string;
  role?: React.AriaRole;
}) {
  return (
    <button
      type="button"
      role={role}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-md text-[13px] text-left transition-colors duration-150 min-h-11',
        'text-foreground hover:bg-muted/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      {children}
    </button>
  );
}

export const NAV_LINK_CLASS =
  'px-3 py-2 rounded-md text-[13px] font-medium whitespace-nowrap min-h-11 flex items-center touch-manipulation ' +
  'transition-[color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]';

export const NAV_LINK_IDLE =
  'text-muted-foreground hover:text-foreground hover:bg-muted/70';

export const NAV_LINK_ACTIVE =
  'text-primary-foreground bg-primary shadow-sm';

export const CAPSULE_NAV_SHELL =
  'inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg ' +
  'bg-background ' +
  'border border-border ' +
  'shadow-nav';

/** Desktop capsule tabs — touch-friendly height, slight horizontal squeeze on laptop */
export const CAPSULE_TAB =
  'px-2.5 xl:px-3.5 py-2 rounded-md text-[12px] xl:text-[13px] font-medium transition-colors duration-200 whitespace-nowrap min-h-11 flex items-center touch-manipulation';

export const CAPSULE_TAB_IDLE =
  'text-muted-foreground hover:text-foreground hover:bg-muted/60';

export const CAPSULE_TAB_ACTIVE =
  'bg-primary text-primary-foreground shadow-sm font-semibold';

export const CAPSULE_TAB_HIGHLIGHT =
  'text-primary hover:bg-primary/10 font-medium';

export const HEADER_BAR_CLASS =
  'relative flex items-center gap-1.5 xl:gap-2 overflow-visible rounded-lg border border-border bg-card px-2.5 xl:px-3 py-1.5 shadow-nav';

/** Extra room so nav shadow is not clipped by transparent header wrappers */
export const HEADER_BAR_WRAP = 'overflow-visible p-1 -m-1';

/** Mobile / tablet menu rows */
export const MOBILE_NAV_LINK =
  'flex items-center justify-center min-h-12 px-4 py-3 rounded-lg text-sm font-medium touch-manipulation transition-colors';
