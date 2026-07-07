'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CadetMateLogo } from '@/components/brand/CadetMateLogo';
import { cn } from '@/lib/utils';
import { PAGE_SHELL_CLASS } from './PageContainer';

const FOOTER_LINKS = {
  Product: [
    { label: 'Learning Modules', href: '/resources' },
    { label: 'Flashcards', href: '/resources' },
    { label: 'Mock Orals', href: '/pricing' },
    { label: 'Simulators', href: '/pricing' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Resources: [
    { label: 'Blog', href: '/free-content' },
    { label: 'Free Resources', href: '/resources' },
    { label: 'Community', href: '/community-preview' },
    { label: 'Partners', href: '/partners' },
  ],
  Company: [
    { label: 'About', href: '/about' },
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
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="flex-1 h-9 px-3 text-sm rounded-lg border border-foreground/[0.1] bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          <button
            type="submit"
            className="h-9 px-3 rounded-lg bg-primary text-white hover:bg-primary/90 hover:text-white transition-colors shrink-0"
            aria-label="Subscribe"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">Study tips & platform updates. No spam.</p>
    </form>
  );
}

export function PublicFooter() {
  return (
    <footer className="relative border-t border-foreground/[0.06] bg-background mt-auto">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent" />
      <div className={cn(PAGE_SHELL_CLASS, 'pt-16 pb-10')}>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 lg:gap-12">
          <div className="col-span-2 md:col-span-4">
            <Link href="/home" className="inline-block">
              <CadetMateLogo size="md" />
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
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground mb-4">
              Legal
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Terms</Link></li>
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
