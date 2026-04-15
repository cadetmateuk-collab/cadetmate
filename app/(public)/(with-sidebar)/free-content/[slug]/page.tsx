import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  author: string;
  author_avatar: string;
  date: string;
  category: string;
  image: string;
  read_time: string;
  featured: boolean;
  hidden: boolean;
}

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('hidden', false)
    .single();

  if (error || !post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
        .bp-anim-4 { animation: fadeUp 0.4s ease both 0.28s; }
        .bp-anim-5 { animation: fadeIn 0.55s ease both 0.18s; }
        .bp-anim-6 { animation: fadeUp 0.4s ease both 0.36s; }

        /* ── Page shell ── */
        .bp-page {
          min-height: 100dvh;
          background-color: hsl(var(--background));
          position: relative;
          overflow-x: hidden;
        }

        /* Dot grid — same as home */
        .bp-dot-grid {
          pointer-events: none;
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          z-index: 0;
        }

        /* Glow — same as home */
        .bp-glow {
          pointer-events: none;
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 900px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
          z-index: 0;
        }

        /* Noise — same as home */
        .bp-noise {
          pointer-events: none;
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
          opacity: 0.025;
          mix-blend-mode: multiply;
          z-index: 0;
        }

        /* ── Content wrapper — wide, centred ── */
        .bp-content {
          position: relative;
          z-index: 1;
          max-width: 1000px;
          margin: 0 auto;
          padding: 1.25rem 2.5rem 6rem;
          text-align: center;
        }

        /* ── Back link — tiny, top-left feel but centred flow ── */
        .bp-back {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground) / 0.6);
          text-decoration: none;
          transition: color 0.15s;
          margin-bottom: 1.75rem;
        }
        .bp-back:hover { color: hsl(var(--primary)); }

        /* ── Title ── */
        .bp-title {
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 0 auto 1.25rem;
          max-width: 820px;
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.7) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Byline — inline, centred ── */
        .bp-byline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid hsl(var(--border));
          width: 100%;
        }
        .bp-avatar {
          width: 1.625rem;
          height: 1.625rem;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          opacity: 0.85;
        }
        .bp-author-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .bp-dot { color: hsl(var(--border)); font-size: 0.875rem; }
        .bp-meta-text {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }

        /* ── Hero image ── */
        .bp-hero {
          width: 100%;
          aspect-ratio: 16 / 7;
          object-fit: cover;
          border-radius: 0.625rem;
          display: block;
          margin-bottom: 2.25rem;
          opacity: 0.95;
        }

        /* ── Excerpt pull-quote — centred ── */
        .bp-excerpt {
          font-size: 1.175rem;
          font-weight: 500;
          line-height: 1.65;
          color: hsl(var(--foreground) / 0.6);
          font-style: italic;
          max-width: 720px;
          margin: 0 auto 2.25rem;
        }

        /* ── Body — left-aligned inside centred wrapper ── */
        .bp-body {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .art-p {
          font-size: 1.0625rem;
          line-height: 1.82;
          color: hsl(var(--foreground) / 0.78);
          margin: 0;
        }
        .art-h1 {
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: hsl(var(--foreground));
        }
        .art-h2 {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -0.015em;
          line-height: 1.25;
          color: hsl(var(--foreground));
          padding-bottom: 0.5rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .art-h3 {
          font-size: 1.125rem;
          font-weight: 700;
          line-height: 1.3;
          color: hsl(var(--foreground));
        }
        .art-figure { margin: 0.5rem 0; }
        .art-figure-img {
          width: 100%;
          display: block;
          border-radius: 0.5rem;
          object-fit: cover;
        }
        .art-figcaption {
          text-align: center;
          font-size: 0.8125rem;
          color: hsl(var(--muted-foreground));
          margin-top: 0.5rem;
          font-style: italic;
        }

        /* ── Footer ── */
        .bp-footer {
          margin-top: 3.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }
        .bp-footer-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground) / 0.6);
          text-decoration: none;
          transition: color 0.15s;
        }
        .bp-footer-link:hover { color: hsl(var(--primary)); }
        .bp-footer-rt {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground) / 0.6);
        }

        @media (max-width: 640px) {
          .bp-content { padding: 1rem 1.25rem 4rem; }
          .bp-title { font-size: 2rem; }
          .bp-hero { aspect-ratio: 16 / 9; }
        }
      `}</style>

      <div className="bp-page">
        <div className="bp-dot-grid" aria-hidden="true" />
        <div className="bp-glow" aria-hidden="true" />
        <div className="bp-noise" aria-hidden="true" />

        <div className="bp-content">

          {/* Title */}
          <h1 className="bp-title bp-anim-2">{post.title}</h1>

          {/* Byline */}
          <div className="bp-byline bp-anim-3">
            {post.author_avatar && (
              <img src={post.author_avatar} alt={post.author} className="bp-avatar" />
            )}
            <span className="bp-author-name">{post.author}</span>
            <span className="bp-dot">·</span>
            <span className="bp-meta-text">
              <Calendar size={10} />
              {formattedDate}
            </span>
            {post.read_time && (
              <>
                <span className="bp-dot">·</span>
                <span className="bp-meta-text">
                  <Clock size={10} />
                  {post.read_time} mins
                </span>
              </>
            )}
          </div>

          {/* Hero */}
          {post.image && (
            <img src={post.image} alt={post.title} className="bp-hero bp-anim-5" />
          )}

          {/* Body */}
          <div className="bp-body bp-anim-6">
            {renderContent(post.content)}
          </div>

          {/* Footer */}
          <div className="bp-footer">
            <Link href="/blog" className="bp-footer-link">
              <ArrowLeft size={11} />
              All articles
            </Link>
            {post.read_time && (
              <span className="bp-footer-rt">{post.read_time}</span>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('hidden', false);
  return (data || []).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, image')
    .eq('slug', slug)
    .single();
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : [],
    },
  };
}