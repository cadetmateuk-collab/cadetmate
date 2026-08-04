import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/button';
import { Anchor, Users, BookOpen, Target, Shield, Mail } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/seo/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'About CadetMate — Maritime Training Built for UK Deck Cadets',
  description:
    'CadetMate is a UK maritime training platform for deck cadets: college modules, COLREGS revision, TRB support, sea-phase learning, and MCA oral prep — built by mariners for future Officers of the Watch.',
  path: '/about',
  keywords: [
    'about CadetMate',
    'UK deck cadet training platform',
    'maritime learning for cadets',
    'MCA syllabus study app',
    'merchant navy cadet education',
  ],
});

const VALUES = [
  { icon: BookOpen, title: 'Built for Cadets', description: 'Features follow the real UK deck journey: college, TRB, sea phase, revision, and MCA orals — not generic exam dumps.' },
  { icon: Users, title: 'Community First', description: 'Cadets learn faster together. Ask questions, share sea-phase tips, and build reputation while you study.' },
  { icon: Target, title: 'Progress Driven', description: 'Streaks, XP, and readiness signals help you stay consistent from Phase 1 through oral preparation.' },
  { icon: Anchor, title: 'By Mariners', description: 'Content and product decisions are shaped around how deck cadets actually train at college and at sea.' },
];

const ABOUT_FAQS = [
  {
    question: 'Who is CadetMate for?',
    answer:
      'CadetMate is for UK merchant navy deck cadets and future Officers of the Watch — from first college phase through sea phases and MCA oral exam preparation.',
  },
  {
    question: 'Who builds CadetMate?',
    answer:
      'CadetMate is built by a team focused on maritime cadet training. Product and content decisions are grounded in real cadetship workflows: modules, TRB evidence, revision between watches, and oral prep.',
  },
  {
    question: 'How does CadetMate support trust and accuracy?',
    answer:
      'We prioritise syllabus-aligned topics (COLREGS, navigation, seamanship, STCW-related study, orals), clear free educational articles, and transparent Free vs Premium access. For support, email the team directly.',
  },
];

export default function AboutPage() {
  const faqSchema = buildFAQSchema(ABOUT_FAQS);

  return (
    <div className="mx-auto max-w-4xl py-12 sm:py-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'About', path: '/about' },
        ])}
      />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">About CadetMate</p>
        <h1 className="text-h1 font-bold tracking-tight text-balance">Maritime training built for UK deck cadets</h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
          We help cadets stay organised and exam-ready from college through sea phases to Officer of the Watch.
        </p>
      </div>

      <section className="prose prose-slate max-w-none mb-12" aria-labelledby="mission-heading">
        <h2 id="mission-heading" className="text-xl font-bold tracking-tight !mb-4">Our mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          CadetMate started from a simple problem: UK deck cadets have textbooks, PDFs, and scattered notes —
          but no single place that combines learning modules, revision tools, TRB support, community, and progress tracking.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-4">
          Our mission is to guide cadets from their first day of training through MCA oral exams with interactive modules,
          realistic practice tools, free educational content, and a community that understands cadetship life at sea and ashore.
        </p>
      </section>

      <section className="mb-12 rounded-2xl border border-border/60 p-6 sm:p-8" aria-labelledby="expertise-heading">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
          <div>
            <h2 id="expertise-heading" className="text-xl font-bold tracking-tight">Experience, expertise &amp; trust</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              CadetMate focuses on the UK deck pathway: COLREGS, navigation and chartwork, cargo and stability,
              meteorology, seamanship, STCW-related study, Training Record Book tasks, and MCA oral preparation.
              Free articles are written for cadets first — practical, readable, and tied to real training stages.
            </p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              We are transparent about what is free and what is Premium, and we provide direct support at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
            </p>
          </div>
        </div>
      </section>

      <h2 className="text-xl font-bold mb-6 text-center">What we stand for</h2>
      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {VALUES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="p-6 rounded-2xl border border-border/60">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        ))}
      </div>

      <section className="mb-12 max-w-2xl mx-auto" aria-labelledby="about-faq-heading">
        <h2 id="about-faq-heading" className="text-xl font-bold text-center mb-6">
          About FAQ
        </h2>
        <div className="space-y-5">
          {ABOUT_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 rounded-2xl bg-muted/40 border border-border p-6 text-center" aria-labelledby="company-heading">
        <h2 id="company-heading" className="text-lg font-bold">Company &amp; contact</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed">
          CadetMate operates at <strong className="text-foreground font-medium">cadetmate.co.uk</strong>.
          For partnerships, press, or support, email us or use the contact page.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-sm">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <Mail className="h-3.5 w-3.5" /> {SUPPORT_EMAIL}
          </a>
          <Link href="/contact" className="text-primary hover:underline">Contact page</Link>
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
        </div>
      </section>

      <div className="text-center rounded-2xl bg-primary/5 border border-primary/20 p-8">
        <h2 className="text-xl font-bold">Ready to start your journey?</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Browse free guides or create a free account for quizzes, community, and revision tools.
        </p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <Button asChild><Link href="/auth?mode=signup">Sign Up Free</Link></Button>
          <Button variant="outline" asChild><Link href="/free-content">Free Articles</Link></Button>
          <Button variant="outline" asChild><Link href="/pricing">View Pricing</Link></Button>
        </div>
      </div>
    </div>
  );
}
