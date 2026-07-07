'use client';

import { cn } from '@/lib/utils';

export const DROPDOWN_PANEL_CLASS =
  'absolute top-full left-0 mt-2 w-56 rounded-xl py-1.5 z-[100] ' +
  'bg-zinc-950/92 backdrop-blur-xl border border-white/[0.08] ' +
  'shadow-[0_8px_32px_rgba(0,0,0,0.32)] ' +
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
  active,
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
        'w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-[13px] text-left transition-all duration-150',
        'text-zinc-300 hover:text-white hover:bg-white/[0.08]',
        active && 'bg-white/[0.1] text-white font-medium',
        className,
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      {children}
    </button>
  );
}

export const NAV_LINK_CLASS =
  'px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap';

export const NAV_LINK_IDLE =
  'text-muted-foreground hover:text-foreground hover:bg-muted/70';

export const NAV_LINK_ACTIVE =
  'text-white bg-primary shadow-sm';

/** Frosted floating capsule — Apple-style tab bar shell */
export const CAPSULE_NAV_SHELL =
  'inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full ' +
  'bg-background/80 backdrop-blur-2xl ' +
  'border border-border/50 ' +
  'shadow-[0_4px_24px_rgba(0,0,0,0.06)] ' +
  'ring-1 ring-inset ring-white/50 dark:ring-white/10';

export const CAPSULE_TAB =
  'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap';

export const CAPSULE_TAB_IDLE =
  'text-muted-foreground hover:text-foreground hover:bg-muted/60';

export const CAPSULE_TAB_ACTIVE =
  'bg-primary text-white shadow-sm font-semibold';
