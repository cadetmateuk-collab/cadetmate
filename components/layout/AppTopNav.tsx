'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown, Menu, X, LogOut, Sparkles, Lock, MoreHorizontal, House,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_SHELL_CLASS } from './PageContainer';
import type { NavUser } from '@/lib/auth/nav-user';
import { PremiumLockModal } from '../PremiumLockModal';
import { GlobalSearch } from '../layout/GlobalSearch';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { CadetMateLogo } from '../brand/CadetMateLogo';
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';
import { UserAvatar } from '@/components/auth/onboarding/UserAvatar';
import {
  APP_NAV_GROUPS,
  MOBILE_BOTTOM_NAV,
  filterNavForUser,
  isNavItemActive,
} from '@/lib/navigation/config';
import type { NavGroupConfig } from '@/lib/navigation/types';
import {
  NavDropdownPanel,
  NavDropdownItem,
  NAV_LINK_ACTIVE,
  NAV_LINK_CLASS,
  NAV_LINK_IDLE,
  HEADER_BAR_CLASS,
  HEADER_BAR_WRAP,
} from './NavDropdownPanel';

/** Solid single-bar shell — centered on page like the public header */
const HEADER_BAR = HEADER_BAR_CLASS;

function AppNavDropdown({
  group,
  isPremium,
  pathname,
  onLockedClick,
}: {
  group: NavGroupConfig;
  isPremium: boolean;
  pathname: string;
  onLockedClick: (e: React.MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (group.items.length === 1) {
    const item = group.items[0];
    const locked = item.premiumOnly && !isPremium;
    return (
      <button
        type="button"
        onClick={(e) => (locked ? onLockedClick(e) : router.push(item.href))}
        className={cn(
          NAV_LINK_CLASS,
          isNavItemActive(pathname, item.href, item.exact) ? NAV_LINK_ACTIVE : NAV_LINK_IDLE,
          locked && 'opacity-70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
        aria-label={locked ? `${group.label} (Premium)` : group.label}
      >
        {group.label}
        {locked && <Lock className="inline h-3 w-3 ml-1 opacity-50" aria-hidden />}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        className={cn(
          NAV_LINK_CLASS,
          'flex items-center gap-1',
          NAV_LINK_IDLE,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {group.label}
        <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <NavDropdownPanel id={panelId} role="menu">
          {group.items.map((item) => {
            const locked = item.premiumOnly && !isPremium;
            const Icon = item.icon;
            return (
              <NavDropdownItem
                key={item.id}
                role="menuitem"
                onClick={(e) => {
                  setOpen(false);
                  if (locked) {
                    onLockedClick(e as unknown as React.MouseEvent);
                    return;
                  }
                  router.push(item.href);
                }}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3 w-3 shrink-0 opacity-50" aria-hidden />}
              </NavDropdownItem>
            );
          })}
        </NavDropdownPanel>
      )}
    </div>
  );
}

export function AppTopNav({ user: userProfile }: { user: NavUser }) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileOpenButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuId = useId();
  const pathname = usePathname();
  const router = useRouter();

  const isPremium = useMemo(
    () => userProfile?.role === 'admin' || userProfile?.role === 'premium',
    [userProfile],
  );

  const navGroups = useMemo(
    () => filterNavForUser(APP_NAV_GROUPS, userProfile?.role),
    [userProfile?.role],
  );

  const handleLockedClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPremiumModal(true);
  }, []);

  useFocusTrap(mobileOpen, mobileMenuRef);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        mobileOpenButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full shrink-0 overflow-visible bg-transparent pt-2 pb-2 pointer-events-none">
        <div className={cn(PAGE_SHELL_CLASS, 'flex justify-center overflow-visible bg-transparent')}>
          {/* Desktop — one centered capsule: logo | nav | actions */}
          <div className={cn(HEADER_BAR_WRAP, 'hidden lg:block pointer-events-auto')}>
            <div className={cn(HEADER_BAR, 'flex')}>
            <Link href="/dashboard" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
              <CadetMateLogo size="sm" showWordmark={false} />
            </Link>

            <nav className="flex items-center gap-0.5 overflow-visible" aria-label="Main navigation">
              <Link
                href="/dashboard"
                className={cn(
                  NAV_LINK_CLASS,
                  'gap-1.5',
                  pathname === '/dashboard' ? NAV_LINK_ACTIVE : NAV_LINK_IDLE,
                )}
              >
                <House className="h-4 w-4 shrink-0" aria-hidden />
                Home
              </Link>
              {navGroups
                .filter((g) => g.id !== 'main')
                .map((group) => (
                  <AppNavDropdown
                    key={group.id}
                    group={group}
                    isPremium={isPremium}
                    pathname={pathname}
                    onLockedClick={handleLockedClick}
                  />
                ))}
            </nav>

            <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
              <GlobalSearch />
              <NotificationCenter />

              {!isPremium && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 min-h-11 h-11 px-3 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 transition-all duration-150 touch-manipulation"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade
                </button>
              )}

              <div ref={profileRef} className="relative">
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  className="h-11 w-11 min-h-11 min-w-11 rounded-full flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity ring-2 ring-primary/20 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <UserAvatar
                    fullName={userProfile.name}
                    avatarKind={userProfile.avatarKind}
                    avatarPreset={userProfile.avatarPreset}
                    size={44}
                  />
                </button>
                {profileOpen && (
                  <NavDropdownPanel align="right" className="w-52">
                    <div className="px-3 py-2.5 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{userProfile.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                    </div>
                    <NavDropdownItem onClick={() => { setProfileOpen(false); router.push('/profile'); }}>
                      Profile
                    </NavDropdownItem>
                    <NavDropdownItem onClick={() => { setProfileOpen(false); router.push('/settings'); }}>
                      Settings
                    </NavDropdownItem>
                    <NavDropdownItem
                      onClick={() => { setProfileOpen(false); router.push('/logout'); }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </NavDropdownItem>
                  </NavDropdownPanel>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Mobile — full-width capsule: logo | menu */}
          <div className={cn(HEADER_BAR_WRAP, 'lg:hidden w-full pointer-events-auto')}>
            <div className={cn(HEADER_BAR, 'flex w-full justify-between')}>
            <Link href="/dashboard" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
              <CadetMateLogo size="sm" showWordmark={false} />
            </Link>
            <button
              ref={mobileOpenButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted transition-colors mr-0.5 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            </div>
          </div>
        </div>
      </header>

      {mounted && createPortal(
        <>
          {mobileOpen && (
          <div
            ref={mobileMenuRef}
            id={mobileMenuId}
            role="dialog"
            aria-modal="true"
            aria-label="App navigation"
            className="fixed inset-0 z-[9999] flex flex-col lg:hidden bg-background"
          >
            <div className="flex items-center justify-between px-5 min-h-14 h-14 border-b border-border pt-[env(safe-area-inset-top)]">
              <CadetMateLogo size="sm" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="h-11 w-11 rounded-lg flex items-center justify-center hover:bg-muted touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))]" aria-label="Mobile app">
              {navGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const locked = item.premiumOnly && !isPremium;
                      const Icon = item.icon;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={(e) => {
                            if (locked) { handleLockedClick(e); return; }
                            setMobileOpen(false);
                            router.push(item.href);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors min-h-[44px]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            isNavItemActive(pathname, item.href, item.exact)
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-muted',
                            locked && 'opacity-70',
                          )}
                          aria-label={locked ? `${item.label} (Premium required)` : item.label}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="flex-1">{item.label}</span>
                          {locked && <Lock className="h-3.5 w-3.5" aria-hidden />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          )}

          <nav
            className="fixed bottom-3 left-3 right-3 z-[9998] flex lg:hidden items-center justify-around h-14 px-2 mx-auto max-w-lg rounded-lg border border-border bg-background shadow-nav pb-[env(safe-area-inset-bottom)]"
            aria-label="Primary"
          >
            {MOBILE_BOTTOM_NAV.map(({ id, href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => router.push(href)}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-h-11 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                >
                  <Icon className={cn('h-5 w-5 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                  <span className="sr-only">{label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex-1 flex flex-col items-center justify-center h-full min-h-11 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              aria-label="More menu"
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" aria-hidden />
            </button>
          </nav>
        </>,
        document.body,
      )}

      <PremiumLockModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}
