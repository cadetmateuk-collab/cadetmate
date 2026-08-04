'use client';

import { useMemo, useState, useEffect, memo, useEffectEvent } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Calendar, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import type { BlogPostSummary } from '@/lib/blog/types';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { BlogCardImage } from '@/components/blog/BlogImage';

const POSTS_PER_PAGE = 9;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const FreeContentListing = memo(function FreeContentListing({
  posts,
  initialQuery = '',
}: {
  posts: BlogPostSummary[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  // Keep `?q=` in the URL so WebSite SearchAction URLs remain shareable/crawlable.
  const syncQueryToUrl = useEffectEvent((term: string) => {
    const next = term.trim()
      ? `${pathname}?q=${encodeURIComponent(term.trim())}`
      : pathname;
    router.replace(next, { scroll: false });
  });

  useEffect(() => {
    const t = window.setTimeout(() => syncQueryToUrl(searchTerm), 300);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [posts, searchTerm],
  );

  const indexOfLast = currentPage * POSTS_PER_PAGE;
  const indexOfFirst = indexOfLast - POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const featuredPost = posts.find((p) => p.featured);

  return (
    <>
      <style>{`
        .fc-page { min-height: 100dvh; background: transparent; position: relative; overflow-x: hidden; }
        .fc-content { position: relative; z-index: 1; width: 100%; margin: 0 auto; padding: 3rem 0 6rem; }
        .fc-header { text-align: center; margin-bottom: 2.75rem; }
        .fc-title { font-size: clamp(2.25rem, 5vw, 3.75rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 0.75rem; color: hsl(var(--foreground)); }
        .fc-subtitle { font-size: 0.9375rem; color: hsl(var(--muted-foreground)); max-width: 640px; margin: 0 auto; line-height: 1.6; }
        .fc-search-wrap { max-width: 480px; margin: 0 auto 3rem; position: relative; }
        .fc-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: hsl(var(--muted-foreground)); pointer-events: none; }
        .fc-search { width: 100%; min-height: 2.75rem; padding: 0.75rem 1rem 0.75rem 2.75rem; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: 0.625rem; font-size: 1rem; color: hsl(var(--foreground)); outline: none; font-family: inherit; }
        .fc-featured { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-radius: 0.75rem; overflow: hidden; border: 1px solid hsl(var(--border)); margin-bottom: 3rem; text-decoration: none; background: hsl(var(--card)); transition: border-color 0.2s, box-shadow 0.2s; }
        .fc-featured:hover { border-color: hsl(var(--primary) / 0.3); box-shadow: 0 8px 40px hsl(var(--primary) / 0.07); }
        .fc-featured-media { max-height: min(280px, 40vw); min-height: 160px; object-fit: cover; width: 100%; height: 100%; }
        .fc-featured-body { padding: clamp(1.25rem, 4vw, 2.5rem); display: flex; flex-direction: column; justify-content: center; text-align: center; align-items: center; }
        .fc-featured-badge { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: hsl(var(--primary)); margin-bottom: 0.875rem; }
        .fc-featured-title { font-size: clamp(1.25rem, 3vw, 1.625rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; color: hsl(var(--foreground)); margin: 0 0 0.75rem; }
        .fc-featured-excerpt { font-size: 0.9375rem; line-height: 1.65; color: hsl(var(--muted-foreground)); margin: 0 0 1.25rem; max-width: 36rem; }
        .fc-featured-meta { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .fc-featured-author { font-size: 0.8125rem; font-weight: 600; color: hsl(var(--foreground)); }
        .fc-featured-dot { color: hsl(var(--border)); }
        .fc-featured-date { font-size: 0.75rem; color: hsl(var(--muted-foreground)); display: inline-flex; align-items: center; gap: 0.2rem; }
        .fc-read-btn { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.04em; color: hsl(var(--primary)); text-transform: uppercase; min-height: 2.75rem; }
        .fc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
        .fc-card { display: flex; flex-direction: column; border: 1px solid hsl(var(--border)); border-radius: 0.75rem; overflow: hidden; text-decoration: none; background: hsl(var(--card)); transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s; }
        .fc-card:hover { border-color: hsl(var(--primary) / 0.28); transform: translateY(-3px); box-shadow: 0 8px 32px hsl(var(--primary) / 0.07); }
        .fc-card-body { padding: 1.25rem 1.375rem 1.5rem; flex: 1; display: flex; flex-direction: column; }
        .fc-card-category { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: hsl(var(--primary)); margin-bottom: 0.35rem; }
        .fc-card-title { font-size: 1rem; font-weight: 700; line-height: 1.3; color: hsl(var(--foreground)); margin: 0 0 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .fc-card-excerpt { font-size: 0.875rem; line-height: 1.6; color: hsl(var(--muted-foreground)); margin: 0 0 1rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .fc-card-footer { display: flex; align-items: center; gap: 0.5rem; padding-top: 0.875rem; border-top: 1px solid hsl(var(--border)); flex-wrap: wrap; }
        .fc-card-author { font-size: 0.75rem; font-weight: 600; color: hsl(var(--foreground)); }
        .fc-card-dot { color: hsl(var(--border)); font-size: 0.75rem; }
        .fc-card-meta { font-size: 0.6875rem; color: hsl(var(--muted-foreground)); display: inline-flex; align-items: center; gap: 0.2rem; }
        .fc-empty { text-align: center; padding: 5rem 0; color: hsl(var(--muted-foreground)); }
        .fc-pagination { display: flex; justify-content: center; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
        .fc-page-btn { min-height: 2.75rem; min-width: 2.75rem; padding: 0.5rem 0.875rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); color: hsl(var(--foreground)); cursor: pointer; font-family: inherit; touch-action: manipulation; }
        .fc-page-btn.active { background: hsl(var(--primary)); color: white; border-color: hsl(var(--primary)); }
        .fc-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .fc-links { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid hsl(var(--border)); }
        .fc-links-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
        .fc-link-pill { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); font-size: 0.8125rem; font-weight: 500; color: hsl(var(--foreground)); text-decoration: none; transition: border-color 0.15s, color 0.15s; touch-action: manipulation; }
        .fc-link-pill:hover { border-color: hsl(var(--primary) / 0.4); color: hsl(var(--primary)); }
        @media (max-width: 1024px) { .fc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px) { .fc-featured { grid-template-columns: 1fr; } .fc-featured-media { max-height: 200px; } }
        @media (max-width: 580px) { .fc-content { padding: 2rem 0 4rem; } .fc-grid { grid-template-columns: 1fr; } .fc-title { font-size: clamp(1.75rem, 8vw, 2rem); } }
      `}</style>

      <div className="fc-page">
        <div className="fc-content">
          <Breadcrumbs items={[{ name: 'Home', path: '/home' }, { name: 'Free Content', path: '/free-content' }]} />

          <header className="fc-header">
            <h1 className="fc-title">Free Maritime Training Articles</h1>
            <p className="fc-subtitle">
              Expert guides on cadetships, OOW preparation, COLREGS, STCW revision, and life at sea —
              written for UK deck cadets.
            </p>
          </header>

          <div className="fc-search-wrap">
            <Search className="fc-search-icon" size={16} aria-hidden />
            <label htmlFor="fc-search" className="sr-only">Search articles</label>
            <input
              id="fc-search"
              type="search"
              placeholder="Search articles by topic, title, or category…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="fc-search"
            />
          </div>

          {featuredPost && !searchTerm && currentPage === 1 && (
            <Link href={buildBlogPostPath(featuredPost)} className="fc-featured">
              {featuredPost.image && (
                <BlogCardImage src={featuredPost.image} alt={featuredPost.title} className="fc-featured-media min-h-[160px] max-h-[200px] sm:max-h-[280px] !h-auto w-full object-cover" />
              )}
              <div className="fc-featured-body">
                <span className="fc-featured-badge"><TrendingUp size={11} /> Featured</span>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{featuredPost.category}</p>
                <h2 className="fc-featured-title">{featuredPost.title}</h2>
                <p className="fc-featured-excerpt">{featuredPost.excerpt}</p>
                <div className="fc-featured-meta">
                  <span className="fc-featured-author">{featuredPost.author}</span>
                  <span className="fc-featured-dot">·</span>
                  <span className="fc-featured-date"><Calendar size={10} />{formatDate(featuredPost.date)}</span>
                  {featuredPost.read_time && (
                    <>
                      <span className="fc-featured-dot">·</span>
                      <span className="fc-featured-date"><Clock size={10} />{featuredPost.read_time}</span>
                    </>
                  )}
                </div>
                <span className="fc-read-btn">Read article <ArrowRight size={13} /></span>
              </div>
            </Link>
          )}

          {currentPosts.length === 0 ? (
            <p className="fc-empty">No articles found.</p>
          ) : (
            <section aria-label="Article listing">
              <div className="fc-grid">
                {currentPosts.map((post) => (
                  <Link key={post.id} href={buildBlogPostPath(post)} className="fc-card">
                    {post.image && <BlogCardImage src={post.image} alt={post.title} />}
                    <div className="fc-card-body">
                      <p className="fc-card-category">{post.category}</p>
                      <h2 className="fc-card-title">{post.title}</h2>
                      <p className="fc-card-excerpt">{post.excerpt}</p>
                      <div className="fc-card-footer">
                        <span className="fc-card-author">{post.author}</span>
                        <span className="fc-card-dot">·</span>
                        <span className="fc-card-meta"><Calendar size={9} />{formatDate(post.date)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalPages > 1 && (
            <nav className="fc-pagination" aria-label="Pagination">
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="fc-page-btn">← Prev</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} type="button" onClick={() => setCurrentPage(i + 1)} className={`fc-page-btn${currentPage === i + 1 ? ' active' : ''}`}>{i + 1}</button>
              ))}
              <button type="button" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="fc-page-btn">Next →</button>
            </nav>
          )}

          <section className="fc-links" aria-label="Explore CadetMate">
            <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Explore more cadet training resources
            </h2>
            <div className="fc-links-grid">
              <Link href="/resources" className="fc-link-pill">Free resources</Link>
              <Link href="/about" className="fc-link-pill">About CadetMate</Link>
              <Link href="/community-preview" className="fc-link-pill">Community preview</Link>
              <Link href="/pricing" className="fc-link-pill">Pricing</Link>
              <Link href="/contact" className="fc-link-pill">Contact</Link>
              <Link href="/auth?mode=signup" className="fc-link-pill">Create free account</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
});
