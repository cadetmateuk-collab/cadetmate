import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Mail, MessageSquare } from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact',
  description: 'Get in touch with the CadetMate team.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground mt-3">
          Questions, feedback, or partnership enquiries — we would love to hear from you.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href="mailto:support@cadetmate.com"
          className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Email Support</p>
            <p className="text-sm text-muted-foreground">support@cadetmate.com</p>
          </div>
        </a>

        <a
          href="/community"
          className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Community</p>
            <p className="text-sm text-muted-foreground">Ask questions in our cadet community</p>
          </div>
        </a>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-10">
        Premium members receive priority support response times.
      </p>
    </div>
  );
}
