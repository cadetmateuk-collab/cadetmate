'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronRight, Lock, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isGroupActive,
  isNavItemActive,
} from '@/lib/navigation/config';
import type { NavGroupConfig, NavItemConfig, UserRole } from '@/lib/navigation/types';
import {
  getAppSidebarGroups,
  PUBLIC_SIDEBAR_NAV,
} from '@/lib/navigation/sidebar-nav';
import type { NavUser } from '@/lib/auth/nav-user';
import { PremiumLockModal } from '@/components/PremiumLockModal';
import { SIDEBAR_COLORS } from '@/components/Sidebar/sidebar-styles';

type MainSidebarProps = {
  variant: 'app' | 'public';
  user?: NavUser | null;
  role?: UserRole;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

type MenuMode = 'flyout' | 'accordion';

/** Solid-enough white pill so active state is always visible on the blue sidebar */
const ACTIVE_PILL: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.24)',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
};

function NavLinkButton({
  item,
  active,
  locked,
  onLocked,
  onNavigate,
  nested = false,
}: {
  item: NavItemConfig;
  active: boolean;
  locked?: boolean;
  onLocked?: () => void;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={(e) => {
        if (locked) {
          e.preventDefault();
          onLocked?.();
          return;
        }
        onNavigate?.();
      }}
      style={!nested && active ? ACTIVE_PILL : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl text-left transition-colors min-h-[44px]',
        nested ? 'px-3 py-2 text-[13px] min-h-[40px] rounded-lg' : 'px-3 py-2.5 text-[13px]',
        nested
          ? active
            ? 'bg-primary/10 font-semibold text-primary'
            : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          : active
            ? 'font-semibold text-white'
            : 'font-medium text-white/80 hover:bg-white/10 hover:text-white',
        locked && 'opacity-70',
      )}
      aria-current={active ? 'page' : undefined}
      aria-label={locked ? `${item.label} (Premium)` : item.label}
    >
      <Icon
        className={cn('shrink-0 opacity-90', nested ? 'h-4 w-4' : 'h-[18px] w-[18px]')}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {locked && <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
    </Link>
  );
}

/** Desktop flyout trigger — open state is owned by the parent so only one panel exists */
function FlyoutTrigger({
  group,
  active,
  isOpen,
  onOpen,
  onIntentClose,
}: {
  group: NavGroupConfig;
  active: boolean;
  isOpen: boolean;
  onOpen: (el: HTMLElement) => void;
  onIntentClose: () => void;
}) {
  const GroupIcon = group.icon;
  const ref = useRef<HTMLDivElement>(null);
  const highlighted = active || isOpen;

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        if (ref.current) onOpen(ref.current);
      }}
      onMouseLeave={onIntentClose}
    >
      <button
        type="button"
        onClick={() => {
          if (isOpen) onIntentClose();
          else if (ref.current) onOpen(ref.current);
        }}
        style={highlighted ? ACTIVE_PILL : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] min-h-[44px] transition-colors',
          highlighted
            ? 'font-semibold text-white'
            : 'font-medium text-white/80 hover:bg-white/10 hover:text-white',
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {GroupIcon ? (
          <GroupIcon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
        ) : null}
        <span className="flex-1 truncate">{group.label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
      </button>
    </div>
  );
}

function FlyoutPanel({
  group,
  coords,
  isPremium,
  pathname,
  onLocked,
  onNavigate,
  onKeepOpen,
  onIntentClose,
}: {
  group: NavGroupConfig;
  coords: { top: number; left: number };
  isPremium: boolean;
  pathname: string;
  onLocked: () => void;
  onNavigate?: () => void;
  onKeepOpen: () => void;
  onIntentClose: () => void;
}) {
  return createPortal(
    <div
      role="menu"
      aria-label={group.label}
      className="fixed z-[200] w-[232px] rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-lg"
      style={{ top: coords.top, left: coords.left }}
      onMouseEnter={onKeepOpen}
      onMouseLeave={onIntentClose}
    >
      {/* Hit-area bridge: covers the gap between sidebar edge and panel */}
      <div className="absolute top-0 -left-2 h-full w-2" aria-hidden />

      <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLinkButton
            key={item.id}
            item={item}
            nested
            active={isNavItemActive(pathname, item.href, item.exact)}
            locked={Boolean(item.premiumOnly && !isPremium)}
            onLocked={onLocked}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function AccordionGroup({
  group,
  isPremium,
  onLocked,
  onNavigate,
}: {
  group: NavGroupConfig;
  isPremium: boolean;
  onLocked: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groupActive = isGroupActive(pathname, group.items);
  const [open, setOpen] = useState(groupActive);
  const GroupIcon = group.icon;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={groupActive || open ? ACTIVE_PILL : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] min-h-[44px] transition-colors',
          groupActive || open
            ? 'font-semibold text-white'
            : 'font-medium text-white/80 hover:bg-white/10 hover:text-white',
        )}
        aria-expanded={open}
      >
        {GroupIcon ? (
          <GroupIcon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
        ) : null}
        <span className="flex-1 truncate">{group.label}</span>
        <ChevronRight
          className={cn('h-4 w-4 shrink-0 opacity-70 transition-transform', open && 'rotate-90')}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-0.5 ml-2 space-y-0.5 rounded-xl bg-white/10 p-1">
          {group.items.map((item) => (
            <NavLinkButton
              key={item.id}
              item={item}
              active={isNavItemActive(pathname, item.href, item.exact)}
              locked={Boolean(item.premiumOnly && !isPremium)}
              onLocked={onLocked}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarBrand({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex h-full w-full items-center gap-2.5 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset"
    >
      <div className="relative h-8 w-8 shrink-0">
        <Image
          src="/images/c2.webp"
          alt=""
          fill
          className="object-contain"
          sizes="32px"
          priority
        />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[14px] font-bold tracking-tight text-white">CadetMate</p>
        <p className="text-[10px] font-medium text-white/55">
          eLearning platform
        </p>
      </div>
    </Link>
  );
}

function roleLabel(role?: UserRole) {
  if (role === 'admin') return 'Admin';
  if (role === 'premium') return 'Premium Cadet';
  return 'Deck Cadet';
}

function SidebarUserFooter({
  user,
  variant,
}: {
  user?: NavUser | null;
  variant: 'app' | 'public';
}) {
  if (variant === 'public' || !user) {
    return (
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-white">Guest</p>
        <p className="text-[11px] text-white/55 truncate">Not signed in</p>
        <Link
          href="/auth"
          className="mt-1 inline-block text-[11px] font-semibold text-white/80 hover:text-white underline-offset-2 hover:underline"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/profile"
      className="block px-3 py-2 rounded-xl hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
      <p className="text-[11px] text-white/55 truncate">{user.email || 'No email'}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
        {roleLabel(user.role)}
      </p>
    </Link>
  );
}

function placeFlyout(trigger: HTMLElement, itemCount: number) {
  const rect = trigger.getBoundingClientRect();
  const estimatedHeight = Math.min(itemCount * 40 + 44, window.innerHeight - 24);
  let top = rect.top;
  if (top + estimatedHeight > window.innerHeight - 12) {
    top = Math.max(12, window.innerHeight - estimatedHeight - 12);
  }
  // Sit flush against the sidebar edge (no gap = no dead zone lag)
  return { top, left: Math.round(rect.right) };
}

function SidebarPanel({
  variant,
  homeHref,
  appGroups,
  isPremium,
  pathname,
  onLocked,
  onNavigate,
  mode,
  fillHeight = false,
  user,
}: {
  variant: 'app' | 'public';
  homeHref: string;
  appGroups: NavGroupConfig[];
  isPremium: boolean;
  pathname: string;
  onLocked: () => void;
  onNavigate?: () => void;
  mode: MenuMode;
  fillHeight?: boolean;
  user?: NavUser | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openGroup = useCallback(
    (group: NavGroupConfig, el: HTMLElement) => {
      clearCloseTimer();
      setCoords(placeFlyout(el, group.items.length));
      setOpenId(group.id);
    },
    [clearCloseTimer],
  );

  const keepOpen = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const intentClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenId(null), 60);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [openId]);

  const activeGroup = openId ? appGroups.find((g) => g.id === openId) : null;

  return (
    <div
      className={cn(
        'flex h-full flex-col text-white pb-4',
        fillHeight && 'min-h-0',
      )}
      style={{
        width: 220,
        background: `linear-gradient(180deg, ${SIDEBAR_COLORS.surface} 0%, ${SIDEBAR_COLORS.surfaceDark} 100%)`,
        ...(fillHeight
          ? { height: '100%', minHeight: '100dvh' }
          : undefined),
      }}
    >
      {/* Match AppHeader h-16 so brand lines up with the top bar */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/10">
        <SidebarBrand href={homeHref} />
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
        aria-label="Main"
      >
        <div className="flex min-h-full flex-col justify-center">
          <div className="w-full space-y-0.5">
            {variant === 'public' ? (
              PUBLIC_SIDEBAR_NAV.map((item) => (
                <NavLinkButton
                  key={item.id}
                  item={item}
                  active={isNavItemActive(pathname, item.href, item.exact)}
                  onNavigate={onNavigate}
                />
              ))
            ) : (
              appGroups.map((group) => {
                if (group.items.length === 1) {
                  const item = group.items[0];
                  return (
                    <NavLinkButton
                      key={group.id}
                      item={{ ...item, label: group.label, icon: group.icon ?? item.icon }}
                      active={isNavItemActive(pathname, item.href, item.exact)}
                      locked={Boolean(item.premiumOnly && !isPremium)}
                      onLocked={onLocked}
                      onNavigate={onNavigate}
                    />
                  );
                }

                if (mode === 'accordion') {
                  return (
                    <AccordionGroup
                      key={group.id}
                      group={group}
                      isPremium={isPremium}
                      onLocked={onLocked}
                      onNavigate={onNavigate}
                    />
                  );
                }

                return (
                  <FlyoutTrigger
                    key={group.id}
                    group={group}
                    active={isGroupActive(pathname, group.items)}
                    isOpen={openId === group.id}
                    onOpen={(el) => openGroup(group, el)}
                    onIntentClose={intentClose}
                  />
                );
              })
            )}
          </div>
        </div>
      </nav>

      <div className="shrink-0 px-1">
        <SidebarUserFooter user={user} variant={variant} />
      </div>

      {mounted && mode === 'flyout' && activeGroup && (
        <FlyoutPanel
          group={activeGroup}
          coords={coords}
          isPremium={isPremium}
          pathname={pathname}
          onLocked={onLocked}
          onNavigate={() => {
            setOpenId(null);
            onNavigate?.();
          }}
          onKeepOpen={keepOpen}
          onIntentClose={intentClose}
        />
      )}
    </div>
  );
}

export function MainSidebar({
  variant,
  user = null,
  role,
  mobileOpen = false,
  onMobileOpenChange,
}: MainSidebarProps) {
  const pathname = usePathname();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const isOpen = onMobileOpenChange ? mobileOpen : internalMobileOpen;
  const setOpen = onMobileOpenChange ?? setInternalMobileOpen;

  const resolvedRole = user?.role ?? role ?? 'free';
  const isPremium = resolvedRole === 'admin' || resolvedRole === 'premium';
  const homeHref = variant === 'app' ? '/dashboard' : '/home';

  const appGroups = useMemo(
    () => (variant === 'app' ? getAppSidebarGroups(resolvedRole) : []),
    [variant, resolvedRole],
  );

  const closeMobile = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <aside
        className="hidden lg:flex sticky top-0 z-40 self-start shrink-0 overflow-visible"
        style={{ width: 220, height: '100dvh', minHeight: '100dvh' }}
      >
        <div className="flex h-full w-full flex-col">
        <SidebarPanel
          variant={variant}
          homeHref={homeHref}
          appGroups={appGroups}
          isPremium={isPremium}
          pathname={pathname}
          onLocked={() => setShowPremiumModal(true)}
          mode="flyout"
          fillHeight
          user={user}
        />
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="relative h-full">
              <button
                type="button"
                onClick={closeMobile}
                className="absolute right-3 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarPanel
                variant={variant}
                homeHref={homeHref}
                appGroups={appGroups}
                isPremium={isPremium}
                pathname={pathname}
                onLocked={() => setShowPremiumModal(true)}
                onNavigate={closeMobile}
                mode="accordion"
                fillHeight
                user={user}
              />
            </div>
          </div>
        </div>
      )}

      {variant === 'app' && (
        <PremiumLockModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      )}
    </>
  );
}

/** Mobile menu trigger used by the top header */
export function SidebarMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-foreground hover:bg-muted transition-colors touch-manipulation"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" aria-hidden />
    </button>
  );
}
