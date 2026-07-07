'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown, Menu, X, LogOut, Sparkles, Lock, MoreHorizontal, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_SHELL_CLASS } from './PageContainer';
import type { NavUser } from '@/lib/auth/nav-user';
import { PremiumLockModal } from '../PremiumLockModal';
import { GlobalSearch } from '../layout/GlobalSearch';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { CadetMateLogo } from '../brand/CadetMateLogo';
import {
  APP_NAV_GROUPS,
  MOBILE_BOTTOM_NAV,
  filterNavForUser,
  isGroupActive,
  isNavItemActive,
} from '@/lib/navigation/config';
import type { NavGroupConfig } from '@/lib/navigation/types';
import {
  NavDropdownPanel,
  NavDropdownItem,
  NAV_LINK_ACTIVE,
  NAV_LINK_CLASS,
  NAV_LINK_IDLE,
} from './NavDropdownPanel';

/** Solid single-bar shell — centered on page like the public header */
const HEADER_BAR =
  'flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 shadow-sm';

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
  const active = isGroupActive(pathname, group.items);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (group.items.length === 1) {
    const item = group.items[0];
    const locked = item.premiumOnly && !isPremium;
    return (
      <button
        onClick={(e) => (locked ? onLockedClick(e) : router.push(item.href))}
        className={cn(
          NAV_LINK_CLASS,
          isNavItemActive(pathname, item.href, item.exact) ? NAV_LINK_ACTIVE : NAV_LINK_IDLE,
          locked && 'opacity-70',
        )}
      >
        {group.label}
        {locked && <Lock className="inline h-3 w-3 ml-1 opacity-50" />}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          NAV_LINK_CLASS,
          'flex items-center gap-1',
          active || open ? NAV_LINK_ACTIVE : NAV_LINK_IDLE,
        )}
      >
        {group.label}
        <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <NavDropdownPanel>
          {group.items.map((item) => {
            const locked = item.premiumOnly && !isPremium;
            const Icon = item.icon;
            return (
              <NavDropdownItem
                key={item.id}
                active={isNavItemActive(pathname, item.href, item.exact)}
                onClick={(e) => {
                  setOpen(false);
                  if (locked) {
                    onLockedClick(e as unknown as React.MouseEvent);
                    return;
                  }
                  router.push(item.href);
                }}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3 w-3 shrink-0 opacity-50" />}
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
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full flex-shrink-0 pt-3 pb-2">
        <div className={cn(PAGE_SHELL_CLASS, 'flex justify-center')}>
          {/* Desktop — one centered capsule: logo | nav | actions */}
          <div
            className={cn(
              HEADER_BAR,
              'hidden lg:flex',
              scrolled && 'shadow-md',
            )}
          >
            <Link href="/dashboard" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
              <CadetMateLogo size="sm" showWordmark={false} />
            </Link>

            <nav className="flex items-center gap-0.5 overflow-visible" aria-label="Main navigation">
              <Link
                href="/dashboard"
                className={cn(
                  NAV_LINK_CLASS,
                  'flex items-center gap-1.5',
                  pathname === '/dashboard' ? NAV_LINK_ACTIVE : NAV_LINK_IDLE,
                )}
              >
                <Home className="h-4 w-4 shrink-0" />
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
              <GlobalSearch className="w-28 xl:w-36" />
              <NotificationCenter />

              {!isPremium && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 transition-all duration-150"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade
                </button>
              )}

              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-primary hover:bg-primary/90 transition-colors ring-2 ring-primary/20"
                  aria-label="Profile menu"
                >
                  {userProfile.initials}
                </button>
                {profileOpen && (
                  <NavDropdownPanel align="right" className="w-52">
                    <div className="px-3 py-2.5 border-b border-white/[0.08] mb-1">
                      <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{userProfile.email}</p>
                    </div>
                    <NavDropdownItem onClick={() => { setProfileOpen(false); router.push('/profile'); }}>
                      Profile
                    </NavDropdownItem>
                    <NavDropdownItem onClick={() => { setProfileOpen(false); router.push('/settings'); }}>
                      Settings
                    </NavDropdownItem>
                    <NavDropdownItem
                      onClick={() => { setProfileOpen(false); router.push('/logout'); }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </NavDropdownItem>
                  </NavDropdownPanel>
                )}
              </div>
            </div>
          </div>

          {/* Mobile — full-width capsule: logo | menu */}
          <div
            className={cn(
              HEADER_BAR,
              'lg:hidden w-full justify-between',
              scrolled && 'shadow-md',
            )}
          >
            <Link href="/dashboard" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
              <CadetMateLogo size="sm" showWordmark={false} />
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors mr-0.5"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mounted && createPortal(
        <>
          <div
            className={cn(
              'fixed inset-0 z-[9999] flex flex-col lg:hidden bg-background transition-all duration-300',
              mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none',
            )}
          >
            <div className="flex items-center justify-between px-5 h-12 border-b border-border">
              <CadetMateLogo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const locked = item.premiumOnly && !isPremium;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={(e) => {
                            if (locked) { handleLockedClick(e); return; }
                            setMobileOpen(false);
                            router.push(item.href);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors',
                            isNavItemActive(pathname, item.href, item.exact)
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted',
                            locked && 'opacity-70',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {locked && <Lock className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="fixed bottom-3 left-3 right-3 z-[9998] flex lg:hidden items-center justify-around h-14 px-2 mx-auto max-w-lg rounded-full border border-border/50 bg-background/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-inset ring-white/50 pb-[env(safe-area-inset-bottom)]">
            {MOBILE_BOTTOM_NAV.map(({ id, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <button
                  key={id}
                  onClick={() => router.push(href)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full"
                >
                  <Icon className={cn('h-5 w-5 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} />
                  {active && <span className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex-1 flex flex-col items-center justify-center h-full"
              aria-label="More menu"
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </>,
        document.body,
      )}

      <PremiumLockModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}
