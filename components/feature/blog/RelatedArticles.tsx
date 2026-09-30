import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { BlogPostSummary } from '@/lib/blog/types';
import { buildBlogPostPath } from '@/lib/blog/paths';

export function RelatedArticles({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 text-center" aria-labelledby="related-articles-heading">
      <h2 id="related-articles-heading" className="mb-4 text-xl font-bold text-foreground">
        Related articles
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={buildBlogPostPath(post)}
            className="card card-hover block p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {post.category}
            </p>
            <h3 className="mt-1 font-semibold text-foreground line-clamp-2">{post.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ArticleCTA() {
  return (
    <section
      className="mt-12 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 sm:p-8 text-center"
      aria-labelledby="article-cta-heading"
    >
      <h2 id="article-cta-heading" className="text-xl font-bold text-foreground">
        Ready to go further with your cadet training?
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
        Explore interactive modules, flashcards, TRB support, and community resources built
        specifically for UK deck cadets preparing for OOW and beyond.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/auth?mode=signup" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
          Create free account
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/unit-modules" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
          Browse modules
        </Link>
        <Link href="/resources" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
          Free resources
        </Link>
      </div>
    </section>
  );
}
