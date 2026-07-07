'use client';

import { cn } from '@/lib/utils';

export const DROPDOWN_PANEL_CLASS =
  'absolute top-full left-0 mt-2 w-56 rounded-lg py-1.5 z-[100] ' +
  'bg-card border border-border ' +
  'shadow-nav ' +
  'animate-in fade-in slide-in-from-top-1 duration-200';

export function NavDropdownPanel({
  children,
  className,
  align = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}) {
  return (
    <div
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
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-md text-[13px] text-left transition-all duration-150 min-h-[44px]',
        'text-foreground hover:bg-muted/60',
        className,
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      {children}
    </button>
  );
}

export const NAV_LINK_CLASS =
  'px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center';

export const NAV_LINK_IDLE =
  'text-muted-foreground hover:text-foreground hover:bg-muted/70';

export const NAV_LINK_ACTIVE =
  'text-primary-foreground bg-primary shadow-sm py-2';

export const CAPSULE_NAV_SHELL =
  'inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg ' +
  'bg-background ' +
  'border border-border ' +
  'shadow-nav';

export const CAPSULE_TAB =
  'px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center';

export const CAPSULE_TAB_IDLE =
  'text-muted-foreground hover:text-foreground hover:bg-muted/60';

export const CAPSULE_TAB_ACTIVE =
  'bg-primary text-primary-foreground shadow-sm font-semibold py-2';

export const CAPSULE_TAB_HIGHLIGHT =
  'text-primary hover:bg-primary/10 font-medium';

export const HEADER_BAR_CLASS =
  'relative flex items-center gap-2 overflow-visible rounded-lg border border-border bg-card px-2 py-1.5 shadow-nav';

/** Extra room so nav shadow is not clipped by transparent header wrappers */
export const HEADER_BAR_WRAP = 'overflow-visible p-1 -m-1';
