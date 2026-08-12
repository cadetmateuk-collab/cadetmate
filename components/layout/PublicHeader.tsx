'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState, useEffect, useId, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_SHELL_CLASS } from './PageContainer';
import { PUBLIC_NAV } from '@/lib/navigation/config';
import { CadetMateLogo } from '@/components/brand/CadetMateLogo';
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';
import { useEscapeKey } from '@/lib/a11y/useEscapeKey';
import { useBodyScrollLock } from '@/lib/a11y/useBodyScrollLock';
import {
  CAPSULE_TAB,
  CAPSULE_TAB_ACTIVE,
  CAPSULE_TAB_IDLE,
  HEADER_BAR_CLASS,
  HEADER_BAR_WRAP,
  MOBILE_NAV_LINK,
} from './NavDropdownPanel';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = useCallback(() => setMobileOpen(false), []);

  useFocusTrap(mobileOpen, menuRef, firstLinkRef);
  useBodyScrollLock(mobileOpen);
  useEscapeKey(mobileOpen, () => {
    closeMenu();
    menuButtonRef.current?.focus();
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href ||
    (href === '/home' && (pathname === '/' || pathname === '/home')) ||
    (href !== '/home' && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible bg-transparent pt-2 pb-2 pointer-events-none safe-pad-x">
      <div className={cn(PAGE_SHELL_CLASS, 'flex justify-center overflow-visible bg-transparent')}>
        {/* Full capsule nav from xl — avoids overflow on 1024–1280 laptops/iPads */}
        <div className={cn(HEADER_BAR_WRAP, 'hidden xl:block pointer-events-auto')}>
          <div className={cn(HEADER_BAR_CLASS, 'flex')}>
            <Link href="/home" className="shrink-0 pl-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
              <CadetMateLogo size="sm" priority />
            </Link>

            <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide" aria-label="Main navigation">
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    CAPSULE_TAB,
                    isActive(item.href) ? CAPSULE_TAB_ACTIVE : CAPSULE_TAB_IDLE,
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
              <Link href="/auth" className={cn(CAPSULE_TAB, CAPSULE_TAB_IDLE, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2')}>
                Log In
              </Link>
              <Link href="/auth?mode=signup" className={cn(CAPSULE_TAB, CAPSULE_TAB_ACTIVE, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2')}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Phone + tablet bar */}
        <div className={cn(HEADER_BAR_WRAP, 'xl:hidden w-full pointer-events-auto')}>
          <div className={cn(HEADER_BAR_CLASS, 'flex w-full justify-between')}>
            <Link href="/home" className="shrink-0 pl-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
              <CadetMateLogo size="sm" priority />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted transition-colors mr-0.5 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls={menuId}
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          ref={menuRef}
          id={menuId}
          className="xl:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-[calc(4.75rem+env(safe-area-inset-top))] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pointer-events-auto overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="flex flex-col gap-1 w-full max-w-lg mx-auto p-3 rounded-xl border border-border bg-card shadow-card" aria-label="Mobile">
            {PUBLIC_NAV.map((item, index) => (
              <Link
                key={item.id}
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  MOBILE_NAV_LINK,
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted/70',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" role="separator" />
            <Link
              href="/auth"
              onClick={closeMenu}
              className={cn(MOBILE_NAV_LINK, 'text-foreground hover:bg-muted/70', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2')}
            >
              Log In
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={closeMenu}
              className={cn(MOBILE_NAV_LINK, 'bg-primary text-primary-foreground', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2')}
            >
              Create Free Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
