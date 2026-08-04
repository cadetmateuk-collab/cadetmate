import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NoCopy } from '@/components/NoCopy';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';

// ── Anon client for build-time functions (generateStaticParams, generateMetadata)
// These run outside a request context so cannot use cookies-based server client.
// Only slugs / metadata are exposed — actual content is protected by RLS.
const anon = createAnonClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  image?: string;
  position: number;
  hidden: boolean;
}

// ── Minimal markdown renderer ─────────────────────────────────────────────────
function renderContent(content: string) {
  if (!content) return null;
  const blocks = content.split(/\n\n+/);

  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('### ')) return <h3 key={i} className="art-h3">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith('## '))  return <h2 key={i} className="art-h2">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('# '))   return <h1 key={i} className="art-h1">{trimmed.slice(2)}</h1>;

    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return (
        <figure key={i} className="art-figure">
          <img src={imgMatch[2]} alt={imgMatch[1]} className="art-figure-img" />
          {imgMatch[1] && <figcaption className="art-figcaption">{imgMatch[1]}</figcaption>}
        </figure>
      );
    }

    const parts = trimmed.split(/(!\[[^\]]*\]\([^)]+\))/g);
    const rendered = parts.map((part, j) => {
      const m = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (m) return <img key={j} src={m[2]} alt={m[1]} style={{ display: 'inline', borderRadius: '0.5rem', maxWidth: '100%' }} />;
      return part;
    });

    return <p key={i} className="art-p">{rendered}</p>;
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SeaSurvivalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Server client — uses cookies, respects RLS (premium/admin only)
  const supabase = await createServerClient();

  const { data: article, error } = await supabase
    .from('sea_survival')
    .select('*')
    .eq('slug', slug)
    .eq('hidden', false)
    .single();

  if (error || !article) notFound();

  // Siblings in the same category for prev / next
  const { data: siblings } = await supabase
    .from('sea_survival')
    .select('id, title, slug, position')
    .eq('category', article.category)
    .eq('hidden', false)
    .order('position');

  const sibs       = siblings ?? [];
  const currentIdx = sibs.findIndex(s => s.slug === slug);
  const prev       = sibs[currentIdx - 1] ?? null;
  const next       = sibs[currentIdx + 1] ?? null;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .bp-anim-1 { animation: fadeUp 0.4s ease both 0.05s; }
        .bp-anim-2 { animation: fadeUp 0.4s ease both 0.12s; }
        .bp-anim-3 { animation: fadeUp 0.4s ease both 0.20s; }
        .bp-anim-5 { animation: fadeIn 0.55s ease both 0.18s; }
        .bp-anim-6 { animation: fadeUp 0.4s ease both 0.36s; }

        .bp-page {
          min-height: 100dvh;
          background: transparent;
          position: relative;
          overflow-x: hidden;
        }

        .bp-content {
          position: relative; z-index: 1;
          width: 100%;
          padding: 1.25rem 0 6rem;
          text-align: center;
        }

        .bp-back {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground) / 0.6);
          text-decoration: none; transition: color 0.15s;
          margin-bottom: 1.75rem;
        }
        .bp-back:hover { color: hsl(var(--primary)); }

        .bp-cat-badge {
          display: inline-block;
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase;
          color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.1);
          padding: 0.2rem 0.625rem; border-radius: 999px;
          margin-bottom: 0.75rem;
        }

        .bp-title {
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
          margin: 0 auto 1.25rem; max-width: 820px;
          color: hsl(var(--foreground));
        }

        .bp-divider {
          width: 100%; border: none;
          border-top: 1px solid hsl(var(--border));
          margin-bottom: 2rem;
        }

        .bp-hero {
          width: 100%; aspect-ratio: 16 / 7; object-fit: cover;
          border-radius: 0.625rem; display: block;
          margin-bottom: 2.25rem; opacity: 0.95;
        }

        .bp-body {
          text-align: left;
          display: flex; flex-direction: column; gap: 1.5rem;
        }

        .art-p  { font-size: 1.0625rem; line-height: 1.82; color: hsl(var(--foreground) / 0.78); margin: 0; }
        .art-h1 { font-size: 1.875rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; color: hsl(var(--foreground)); }
        .art-h2 {
          font-size: 1.4rem; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25;
          color: hsl(var(--foreground)); padding-bottom: 0.5rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .art-h3 { font-size: 1.125rem; font-weight: 700; line-height: 1.3; color: hsl(var(--foreground)); }
        .art-figure { margin: 0.5rem 0; }
        .art-figure-img { width: 100%; display: block; border-radius: 0.5rem; object-fit: cover; }
        .art-figcaption {
          text-align: center; font-size: 0.8125rem;
          color: hsl(var(--muted-foreground)); margin-top: 0.5rem; font-style: italic;
        }

        .bp-footer {
          margin-top: 3.5rem; padding-top: 1.5rem;
          border-top: 1px solid hsl(var(--border));
          display: flex; align-items: center; justify-content: space-between;
          text-align: left;
        }
        .bp-footer-link {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground) / 0.6);
          text-decoration: none; transition: color 0.15s;
        }
        .bp-footer-link:hover { color: hsl(var(--primary)); }
        .bp-pager-next {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground) / 0.6);
          text-decoration: none; transition: color 0.15s;
        }
        .bp-pager-next:hover { color: hsl(var(--primary)); }

        @media (max-width: 640px) {
          .bp-content { padding: 1rem 1.25rem 4rem; }
          .bp-title   { font-size: 2rem; }
          .bp-hero    { aspect-ratio: 16 / 9; }
        }
      `}</style>

      <div className="bp-page">

        <NoCopy className="bp-content">

          <div className="bp-anim-1">
            <Link href="/sea-survival" className="bp-back">
              <ArrowLeft size={11} /> Sea Survival
            </Link>
          </div>

          <div className="bp-anim-2">
            <span className="bp-cat-badge">{article.category}</span>
            <h1 className="bp-title">{article.title}</h1>
          </div>

          <hr className="bp-divider bp-anim-3" />

          {article.image && (
            <img src={article.image} alt={article.title} className="bp-hero bp-anim-5" />
          )}

          <div className="bp-body bp-anim-6">
            {renderContent(article.content)}
          </div>

          <div className="bp-footer">
            {prev ? (
              <Link href={`/sea-survival/${prev.slug}`} className="bp-footer-link">
                <ArrowLeft size={11} /> {prev.title}
              </Link>
            ) : (
              <Link href="/sea-survival" className="bp-footer-link">
                <ArrowLeft size={11} /> All topics
              </Link>
            )}

            {next ? (
              <Link href={`/sea-survival/${next.slug}`} className="bp-pager-next">
                {next.title} →
              </Link>
            ) : <span />}
          </div>

        </NoCopy>
      </div>
    </>
  );
}

// ── Build-time functions — use anon client (no request context available) ─────
// RLS allows reading slugs/metadata publicly (hidden = false).
// Actual article content is still protected by the premium RLS policy at render time.

export async function generateStaticParams() {
  const { data } = await anon
    .from('sea_survival')
    .select('slug')
    .eq('hidden', false);
  return (data ?? []).map(a => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: article } = await anon
    .from('sea_survival')
    .select('title, category, image')
    .eq('slug', slug)
    .single();
  if (!article) return {};
  return buildPageMetadata({
    title: article.title,
    description: `${article.category} — Sea Survival training for deck cadets.`,
    path: `/sea-survival/${slug}`,
    image: article.image ?? undefined,
    imageAlt: article.title,
    noIndex: true,
  });
}