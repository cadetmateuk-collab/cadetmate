'use client';

import Link from 'next/link';
import { CadetMateLogo } from '@/components/feature/brand/CadetMateLogo';
import { PAGE_SHELL_CLASS } from './PageContainer';
import { cn } from '@/lib/utils';
import { CookieSettingsLink } from '@/components/feature/cookies/CookieConsentBanner';

const FOOTER_LINKS = [
  { href: '/terms', label: 'Terms of Use' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/refunds', label: 'Refunds' },
  { href: '/faq', label: 'FAQ' },
  { href: '/accessibility', label: 'Accessibility' },
  { href: '/contact', label: 'Contact' },
] as const;

const linkClass =
  'hover:text-foreground hover:underline underline-offset-4 transition-colors min-h-11 inline-flex items-center';

/** Compact footer matching the dashboard mockup */
export function PublicFooter() {
  return (
    <footer className="relative mt-auto border-t border-border/70 bg-white">
      <div
        className={cn(
          PAGE_SHELL_CLASS,
          'flex flex-col gap-4 py-5',
        )}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CadetMateLogo size="sm" showWordmark={false} />
            <p className="text-xs text-muted-foreground">
              CadetMate © 2026 All rights reserved
            </p>
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-label="Legal and help"
        >
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
          <CookieSettingsLink className={linkClass} />
        </nav>
      </div>
    </footer>
  );
}
