'use client';

import Link from 'next/link';
import { CadetMateLogo } from '@/components/brand/CadetMateLogo';
import { PAGE_SHELL_CLASS } from './PageContainer';
import { cn } from '@/lib/utils';

/** Compact footer matching the dashboard mockup */
export function PublicFooter() {
  return (
    <footer className="relative mt-auto border-t border-border/70 bg-white">
      <div
        className={cn(
          PAGE_SHELL_CLASS,
          'flex flex-col sm:flex-row items-center justify-between gap-3 py-5',
        )}
      >
        <div className="flex items-center gap-2.5">
          <CadetMateLogo size="sm" showWordmark={false} />
          <p className="text-xs text-muted-foreground">
            CadetMate © 2026 All rights reserved
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/contact" className="hover:text-foreground transition-colors min-h-11 inline-flex items-center">
            Terms of Use
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors min-h-11 inline-flex items-center">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
