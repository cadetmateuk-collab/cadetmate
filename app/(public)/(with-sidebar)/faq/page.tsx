import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/feature/seo/JsonLd';
import { ALL_PUBLIC_FAQS } from '@/lib/seo/faqs';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'FAQ — CadetMate for UK Deck Cadets',
  description:
    'Answers for UK deck cadets: is CadetMate free, how Premium and refunds work, time commitment, MCA oral prep, and whether it is an official qualification.',
  path: '/faq',
  keywords: [
    'CadetMate FAQ',
    'deck cadet training questions',
    'MCA oral prep FAQ',
    'CadetMate premium cost',
  ],
});

export default function FaqPage() {
  const faqSchema = buildFAQSchema([...ALL_PUBLIC_FAQS]);

  return (
    <div className="mx-auto w-full max-w-3xl py-12 sm:py-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'FAQ', path: '/faq' },
        ])}
      />
      {faqSchema && <JsonLd data={faqSchema} />}

      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Help</p>
      <h1 className="text-h1 font-bold tracking-tight text-balance">
        Frequently asked questions
      </h1>
      <p className="text-muted-foreground mt-3 leading-relaxed">
        Straight answers for aspiring and current UK deck cadets considering CadetMate.
      </p>

      <div className="mt-10 space-y-6">
        {ALL_PUBLIC_FAQS.map((faq) => (
          <section key={faq.question} className="rounded-2xl border border-border/60 p-5 sm:p-6">
            <h2 className="font-semibold text-base text-foreground">{faq.question}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.answer}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
        <h2 className="text-xl font-bold">Still have a question?</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Start free, compare plans, or send us a message.
        </p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <Button asChild>
            <Link href="/auth?mode=signup">Start Learning Free</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
