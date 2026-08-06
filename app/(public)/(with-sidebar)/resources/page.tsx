import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { absoluteUrl } from '@/lib/seo/site';
import { BookOpen, Compass, Mic, FileText, LifeBuoy, Anchor, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'Free Deck Cadet Study Hub — COLREGS, TRB, Orals & More',
  description:
    'Free UK deck cadet study hub: COLREGS revision, TRB guidance, sea survival, MCA oral prep pathways, and cadetship articles. Start with free guides — upgrade when you need full modules.',
  path: '/resources',
  keywords: [
    'deck cadet study resources',
    'COLREGS revision free',
    'TRB guidance cadet',
    'MCA oral prep resources',
    'STCW study materials UK',
    'merchant navy cadet guides',
  ],
});

const TOPIC_HUBS = [
  {
    icon: Compass,
    title: 'COLREGS & rules of the road',
    description: 'Revision pathways for collision regulations — pair free guides with flashcards when you create an account.',
    href: '/free-content?q=COLREGS',
    cta: 'Search COLREGS guides',
  },
  {
    icon: FileText,
    title: 'Training Record Book (TRB)',
    description: 'How cadets approach TRB tasks and sea-phase evidence without losing track during busy watches.',
    href: '/free-content?q=TRB',
    cta: 'Find TRB articles',
  },
  {
    icon: Mic,
    title: 'MCA oral exam prep',
    description: 'Understand the oral pathway, then use Premium practice tools when you are ready for structured mock orals.',
    href: '/pricing',
    cta: 'See oral prep plans',
  },
  {
    icon: LifeBuoy,
    title: 'STCW & sea survival',
    description: 'Safety-minded study topics for pre-sea and refresher learning. Full sea survival library unlocks with a free account.',
    href: '/auth?mode=signup',
    cta: 'Sign up for survival content',
  },
  {
    icon: Anchor,
    title: 'Cadetship & life at sea',
    description: 'Practical articles on college, first ship, packing, and the day-to-day reality of deck cadet training.',
    href: '/free-content',
    cta: 'Browse cadetship guides',
  },
  {
    icon: BookOpen,
    title: 'Full free article library',
    description: 'Every published CadetMate guide in one index — search by topic, title, or category.',
    href: '/free-content',
    cta: 'Open free content',
  },
];

export default async function ResourcesPage() {
  const supabase = await createClient();

  const { data: blogs } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, date, category, category_slug')
    .eq('hidden', false)
    .order('date', { ascending: false })
    .limit(6);

  const collectionSchema = buildCollectionPageSchema({
    name: 'Free Deck Cadet Study Hub',
    description: 'Topic hubs and free maritime guides for UK deck cadets.',
    path: '/resources',
    items: (blogs ?? []).map((b) => ({
      name: b.title,
      url: absoluteUrl(buildBlogPostPath(b)),
    })),
  });

  return (
    <div className="mx-auto w-full py-12 sm:py-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Resources', path: '/resources' },
        ])}
      />
      <JsonLd data={collectionSchema} />

      <div className="mb-12 max-w-3xl">
        <h1 className="text-h1 font-bold tracking-tight text-foreground text-balance">
          Free deck cadet study hub
        </h1>
        <p className="text-muted-foreground mt-3">
          Topic pathways for UK deck cadets — COLREGS, TRB, sea survival, cadetship guides, and routes into MCA oral prep.
          This hub points you to the right free content; the full article index lives on Free Content.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button asChild>
            <Link href="/free-content">All free articles</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth?mode=signup">Create free account</Link>
          </Button>
        </div>
      </div>

      <section className="mb-14" aria-labelledby="topic-hubs-heading">
        <h2 id="topic-hubs-heading" className="text-lg font-semibold mb-5">
          Study by topic
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPIC_HUBS.map(({ icon: Icon, title, description, href, cta }) => (
            <Link
              key={title}
              href={href}
              className="p-5 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all block group"
            >
              <Icon className="h-5 w-5 text-primary mb-3" aria-hidden />
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-4">
                {cta} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12" aria-labelledby="latest-guides-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="latest-guides-heading" className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Latest free guides
          </h2>
          <Link href="/free-content" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(blogs ?? []).map((b) => (
            <Link
              key={b.slug}
              href={buildBlogPostPath(b)}
              className="card card-hover p-5 block"
            >
              {b.category && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">{b.category}</p>
              )}
              <h3 className="font-medium text-sm text-foreground line-clamp-2">{b.title}</h3>
              {b.excerpt && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{b.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-2xl bg-muted/50 border border-border p-8 text-center">
        <h2 className="font-semibold">Need the full training platform?</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
          Free guides help you learn in the open web. A free CadetMate account adds quizzes, community, and limited flashcards.
          Premium unlocks modules, unlimited revision, and MCA oral practice.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <Button asChild>
            <Link href="/auth?mode=signup">Get started free</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">About CadetMate</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
