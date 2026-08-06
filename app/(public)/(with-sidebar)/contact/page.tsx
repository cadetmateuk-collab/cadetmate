import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildContactPageSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Mail, MessageSquare } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/seo/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact CadetMate — Support & Partnerships',
  description:
    'Contact the CadetMate team for support, feedback, or partnership enquiries. Email support@cadetmate.com or join the cadet community preview.',
  path: '/contact',
  keywords: [
    'contact CadetMate',
    'CadetMate support',
    'maritime training partnership',
    'deck cadet help',
  ],
});

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl py-12 sm:py-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildContactPageSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Contact', path: '/contact' },
        ])}
      />

      <div className="text-center mb-10">
        <h1 className="text-h1 font-bold tracking-tight text-balance">Contact Us</h1>
        <p className="text-muted-foreground mt-3">
          Questions, feedback, or partnership enquiries — we would love to hear from you.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Email Support</h2>
            <p className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
          </div>
        </a>

        <Link
          href="/community-preview"
          className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Community Preview</h2>
            <p className="text-sm text-muted-foreground">See what cadets are discussing before you join</p>
          </div>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-10">
        Premium members receive priority support response times.{' '}
        <Link href="/pricing" className="text-primary hover:underline">
          View pricing
        </Link>
      </p>
    </div>
  );
}
