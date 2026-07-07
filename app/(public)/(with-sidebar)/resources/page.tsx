import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { BookOpen, FileText, Anchor, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'Free Learning Resources',
  description: 'Free maritime learning resources for UK deck cadets — articles, guides, and study materials.',
  path: '/resources',
});

export default async function ResourcesPage() {
  const supabase = await createClient();

  const [{ data: blogs }, { data: articles }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, date')
      .eq('hidden', false)
      .order('date', { ascending: false })
      .limit(6),
    supabase
      .from('sea_survival')
      .select('slug, title, category')
      .eq('hidden', false)
      .limit(4),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Free Learning Resources</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Discover free maritime content — no account required. Create a free account to save progress and unlock more.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/auth?mode=signup">Create Free Account</Link>
        </Button>
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Blog Articles
          </h2>
          <Link href="/free-content" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(blogs ?? []).map((b) => (
            <Link
              key={b.slug}
              href={`/free-content/${b.slug}`}
              className="p-5 rounded-2xl border border-border/60 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <p className="font-medium text-sm line-clamp-2">{b.title}</p>
              {b.excerpt && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{b.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Anchor className="h-5 w-5 text-primary" /> Sea Survival Articles
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(articles ?? []).map((a) => (
            <Link
              key={a.slug}
              href={`/sea-survival/${a.slug}`}
              className="p-4 rounded-2xl border border-border/60 hover:shadow-md transition-all flex items-center gap-3"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">{a.title}</p>
                {a.category && <p className="text-xs text-muted-foreground">{a.category}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-2xl bg-muted/50 border border-border p-8 text-center">
        <p className="font-semibold">Want the full learning experience?</p>
        <p className="text-sm text-muted-foreground mt-2">
          Sign up free for flashcards, progress tracking, community, and daily quizzes.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/auth?mode=signup">Get Started Free</Link>
        </Button>
      </div>
    </div>
  );
}
