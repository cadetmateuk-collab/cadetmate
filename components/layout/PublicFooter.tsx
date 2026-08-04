'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CadetMateLogo } from '@/components/brand/CadetMateLogo';
import { cn } from '@/lib/utils';
import { PAGE_SHELL_CLASS } from './PageContainer';

const FOOTER_LINKS = {
  Product: [
    { label: 'Free Articles', href: '/free-content' },
    { label: 'Study Hub', href: '/resources' },
    { label: 'Community Preview', href: '/community-preview' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Resources: [
    { label: 'COLREGS Guides', href: '/free-content?q=COLREGS' },
    { label: 'TRB Guidance', href: '/free-content?q=TRB' },
    { label: 'Cadetship Articles', href: '/free-content' },
    { label: 'Get Started Free', href: '/auth?mode=signup' },
  ],
  Company: [
    { label: 'About CadetMate', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Sign Up', href: '/auth?mode=signup' },
    { label: 'Log In', href: '/auth' },
  ],
};

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
        Stay updated
      </p>
      {sent ? (
        <p className="text-sm text-muted-foreground">Thanks — we&apos;ll be in touch.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Email address for newsletter
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            autoComplete="email"
            className="flex-1 min-h-11 h-11 px-3 text-sm rounded-lg border border-foreground/[0.1] bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary/30 transition-colors"
          />
          <button
            type="submit"
            className="h-11 min-h-11 min-w-11 px-3 rounded-lg bg-primary text-white hover:bg-primary/90 hover:text-white transition-colors shrink-0 touch-manipulation inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Subscribe to newsletter"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">Study tips & platform updates. No spam.</p>
    </form>
  );
}

export function PublicFooter() {
  return (
    <footer className="relative border-t border-foreground/[0.06] bg-background mt-auto">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent" />
      <div className={cn(PAGE_SHELL_CLASS, 'pt-16 pb-10')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-12 gap-8 sm:gap-10 lg:gap-12">
          <div className="col-span-2 sm:col-span-3 md:col-span-4">
            <Link href="/home" className="inline-block">
              <CadetMateLogo size="md" priority={false} />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4 max-w-xs">
              One platform to support every stage of your cadetship — from college through sea phases to becoming a qualified Officer of the Watch.
            </p>
            <NewsletterForm />
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="col-span-1 md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground mb-4">
                {title}
              </p>
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center min-h-11 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 touch-manipulation"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-1 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground mb-4">
              Legal
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><Link href="/contact" className="inline-flex items-center min-h-11 hover:text-foreground transition-colors touch-manipulation">Privacy</Link></li>
              <li><Link href="/contact" className="inline-flex items-center min-h-11 hover:text-foreground transition-colors touch-manipulation">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-foreground/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CadetMate. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for cadets, by mariners.
          </p>
        </div>
      </div>
    </footer>
  );
}
