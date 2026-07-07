'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItemConfig } from '@/lib/navigation/types';
import { glassStyle, SIDEBAR_TEXT } from './sidebar-styles';

function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] rounded-r-full bg-white"
      style={{ boxShadow: '0 0 6px rgba(255,255,255,0.7)' }}
    />
  );
}

export function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  locked,
  onLockedClick,
  navRef,
}: {
  item: NavItemConfig;
  isActive: boolean;
  isCollapsed: boolean;
  locked?: boolean;
  onLockedClick?: (e: React.MouseEvent) => void;
  navRef: React.RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  useEffect(() => {
    setHovered(false);
  }, [isCollapsed]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const from = e.relatedTarget as Node | null;
    if (from && navRef.current && !navRef.current.contains(from)) return;
    setHovered(true);
  };

  const dynamicStyle =
    isActive ? glassStyle('active') : hovered ? glassStyle('hover') : glassStyle('idle');

  return (
    <div className="relative">
      {isActive && <ActiveBar />}
      <button
        onClick={(e) => (locked && onLockedClick ? onLockedClick(e) : router.push(item.href))}
        title={isCollapsed ? item.label : undefined}
        style={dynamicStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'relative flex items-center w-full rounded-lg transition-all duration-150 cursor-pointer py-[9px]',
          isCollapsed ? 'justify-center px-[10px]' : 'pl-3 pr-3 gap-2.5',
          isActive ? 'text-white font-semibold' : SIDEBAR_TEXT.idle,
          locked && 'opacity-60',
        )}
      >
        <Icon className="h-[16px] w-[16px] flex-shrink-0" />
        <span
          className={cn(
            'text-[13px] text-left whitespace-nowrap overflow-hidden tracking-[0.1px] transition-all duration-300',
            isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'flex-1 opacity-100',
          )}
        >
          {item.label}
        </span>
        {locked && !isCollapsed && <Lock className="h-3 w-3 flex-shrink-0 opacity-50" />}
        {item.badge && !isCollapsed && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
            {item.badge}
          </span>
        )}
      </button>
    </div>
  );
}

export function SidebarCollapsibleGroup({
  label,
  isCollapsed,
  defaultOpen,
  isGroupActive,
  children,
}: {
  label: string;
  isCollapsed: boolean;
  defaultOpen?: boolean;
  isGroupActive: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? isGroupActive);

  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  if (isCollapsed) {
    return <div className="space-y-0.5">{children}</div>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'flex w-full items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-150',
          isGroupActive ? 'text-white/90' : 'text-white/50 hover:text-white/75',
        )}
      >
        <span className={SIDEBAR_TEXT.label}>{label}</span>
        <ChevronRight
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            open && 'rotate-90',
          )}
        />
      </button>
      {open && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  );
}

export function SidebarSectionLabel({
  children,
  isCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) {
  return (
    <div className="relative overflow-hidden" style={{ height: '36px' }}>
      <p
        className={cn(
          SIDEBAR_TEXT.label,
          'absolute inset-0 flex items-end px-3 pb-1 whitespace-nowrap transition-all duration-300',
        )}
        style={{
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed ? 'translateX(-4px)' : 'translateX(0)',
        }}
      >
        {children}
      </p>
      <div
        className="absolute inset-0 flex items-center px-2 transition-all duration-300"
        style={{ opacity: isCollapsed ? 1 : 0 }}
      >
        <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
      </div>
    </div>
  );
}
