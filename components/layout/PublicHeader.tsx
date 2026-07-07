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
  HEADER_BAR_CLASS,
  HEADER_BAR_WRAP,
} from './NavDropdownPanel';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/home' && pathname.startsWith(href + '/'));

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible bg-transparent pt-3 pb-3 pointer-events-none">
      <div className={cn(PAGE_SHELL_CLASS, 'flex justify-center overflow-visible bg-transparent')}>
        <div className={cn(HEADER_BAR_WRAP, 'hidden lg:block pointer-events-auto')}>
          <div className={cn(HEADER_BAR_CLASS, 'flex')}>
          <Link href="/home" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
            <CadetMateLogo size="sm" />
          </Link>

          <nav className="flex items-center gap-0.5 overflow-visible" aria-label="Main navigation">
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
        </div>

        <div className={cn(HEADER_BAR_WRAP, 'lg:hidden w-full pointer-events-auto')}>
          <div className={cn(HEADER_BAR_CLASS, 'flex w-full justify-between')}>
          <Link href="/home" className="shrink-0 pl-1 transition-opacity hover:opacity-80">
            <CadetMateLogo size="sm" />
          </Link>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted transition-colors mr-0.5"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-[4.5rem] px-4">
          <nav className="flex flex-col gap-0.5 w-full max-w-md mx-auto p-2 rounded-lg border border-border bg-background shadow-card">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  CAPSULE_TAB,
                  'justify-center',
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
              className={cn(CAPSULE_TAB, CAPSULE_TAB_IDLE, 'justify-center')}
            >
              Log In
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={() => setMobileOpen(false)}
              className={cn(CAPSULE_TAB, CAPSULE_TAB_ACTIVE, 'justify-center')}
            >
              Create Free Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
