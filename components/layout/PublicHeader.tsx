'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_SHELL_CLASS } from './PageContainer';
import { PUBLIC_NAV } from '@/lib/navigation/config';
import { CadetMateLogo } from '@/components/brand/CadetMateLogo';
import {
  CAPSULE_TAB,
  CAPSULE_TAB_ACTIVE,
  CAPSULE_TAB_IDLE,
} from './NavDropdownPanel';

/** Solid single-bar shell — content-sized so logo, nav, and auth sit close together */
const HEADER_BAR =
  'flex items-center gap-3 rounded-full border border-border bg-background px-2 py-1.5 shadow-sm';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/home' && pathname.startsWith(href + '/'));

  return (
    <header className="sticky top-0 z-50 w-full pt-3 pb-2">
      <div className={cn(PAGE_SHELL_CLASS, 'flex justify-center')}>
        {/* Desktop — one compact capsule: logo | nav | auth */}
        <div
          className={cn(
            HEADER_BAR,
            'hidden lg:flex',
            scrolled && 'shadow-md',
          )}
        >
          <Link href="/home" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
            <CadetMateLogo size="sm" />
          </Link>

          <nav
            className="flex items-center gap-0.5"
            aria-label="Main navigation"
          >
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  CAPSULE_TAB,
                  isActive(item.href) ? CAPSULE_TAB_ACTIVE : CAPSULE_TAB_IDLE,
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
            <Link href="/auth" className={cn(CAPSULE_TAB, CAPSULE_TAB_IDLE)}>
              Log In
            </Link>
            <Link href="/auth?mode=signup" className={cn(CAPSULE_TAB, CAPSULE_TAB_ACTIVE)}>
              Sign Up
            </Link>
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
          <Link href="/home" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
            <CadetMateLogo size="sm" />
          </Link>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors mr-0.5"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-[4.5rem] px-4">
          <nav className="flex flex-col gap-0.5 w-full max-w-md mx-auto p-2 rounded-2xl border border-border bg-background shadow-md">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  CAPSULE_TAB,
                  'text-center',
                  isActive(item.href) ? CAPSULE_TAB_ACTIVE : CAPSULE_TAB_IDLE,
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-border my-1" />
            <Link
              href="/auth"
              onClick={() => setMobileOpen(false)}
              className={cn(CAPSULE_TAB, CAPSULE_TAB_IDLE, 'text-center')}
            >
              Log In
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={() => setMobileOpen(false)}
              className={cn(CAPSULE_TAB, CAPSULE_TAB_ACTIVE, 'text-center')}
            >
              Create Free Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
