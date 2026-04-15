"use client"
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  position: number;
  image?: string;
}

// Deterministic but varied colour per category using CSS variables
const CATEGORY_ACCENTS = [
  'hsl(var(--primary))',
  'hsl(160 60% 42%)',
  'hsl(38 90% 52%)',
  'hsl(280 55% 55%)',
  'hsl(10 75% 52%)',
  'hsl(200 70% 48%)',
];

function categoryColour(index: number) {
  return CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length];
}

export default function SeaSurvivalPage() {
  const [articles, setArticles]       = useState<Article[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('sea_survival')
        .select('id, title, slug, category, position, image')
        .eq('hidden', false)
        .order('category')
        .order('position');
      if (data) setArticles(data);
      setLoading(false);
    }
    fetch();
  }, []);

  // Group by category, preserving insertion order
  const grouped = articles.reduce<Record<string, Article[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  if (loading) {
    return (
      <div className="ss-page ss-loading">
        <div className="ss-dot-grid" />
        <div className="ss-glow" />
        <div className="ss-noise" />
        <div className="ss-spinner" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes popIn   { from { opacity:0; transform:scale(0.93) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }

        .ss-anim-1 { animation: fadeUp 0.4s ease both 0.05s; }
        .ss-anim-2 { animation: fadeUp 0.4s ease both 0.13s; }
        .ss-anim-3 { animation: fadeUp 0.4s ease both 0.21s; }

        /* ── Shell ── */
        .ss-page { min-height:100dvh; background:hsl(var(--background)); position:relative; overflow-x:hidden; }
        .ss-loading { display:flex; align-items:center; justify-content:center; }
        .ss-spinner {
          width:2rem; height:2rem; border-radius:50%;
          border:2px solid hsl(var(--border)); border-top-color:hsl(var(--primary));
          animation:spin 0.75s linear infinite; position:relative; z-index:1;
        }

        /* ── Backgrounds ── */
        .ss-dot-grid {
          pointer-events:none; position:fixed; inset:0; z-index:0;
          background-image:radial-gradient(circle, hsl(var(--foreground)/0.07) 1px, transparent 1px);
          background-size:28px 28px;
          mask-image:radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          -webkit-mask-image:radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
        }
        .ss-glow {
          pointer-events:none; position:fixed; z-index:0;
          top:-200px; left:50%; transform:translateX(-50%);
          width:900px; height:900px; border-radius:50%;
          background:radial-gradient(circle, hsl(var(--primary)/0.055) 0%, transparent 66%);
        }
        .ss-noise {
          pointer-events:none; position:fixed; inset:0; z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat:repeat; background-size:180px 180px;
          opacity:0.025; mix-blend-mode:multiply;
        }

        /* ── Content ── */
        .ss-content {
          position:relative; z-index:1;
          max-width:1100px; margin:0 auto;
          padding:3rem 2.5rem 7rem;
        }

        /* ── Header ── */
        .ss-header { text-align:center; margin-bottom:3.5rem; }
        .ss-eyebrow {
          display:inline-flex; align-items:center; gap:0.4rem;
          font-size:0.6875rem; font-weight:700; letter-spacing:0.09em;
          text-transform:uppercase; color:hsl(var(--primary));
          margin-bottom:0.875rem;
        }
        .ss-eyebrow-dot {
          width:5px; height:5px; border-radius:50%;
          background:hsl(var(--primary)); opacity:0.7;
        }
        .ss-title {
          font-size:clamp(2.25rem, 5vw, 3.75rem);
          font-weight:800; letter-spacing:-0.03em; line-height:1.1;
          margin:0 0 0.875rem;
          background:linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)/0.7) 100%);
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
        }
        .ss-subtitle {
          font-size:1rem; color:hsl(var(--muted-foreground));
          max-width:480px; margin:0 auto; line-height:1.6;
        }

        /* ── Mindmap layout ── */
        .ss-mindmap {
          display:flex;
          flex-direction:column;
          gap:2.25rem;
        }

        /* ── Category row ── */
        .ss-cat-row {
          display:grid;
          grid-template-columns:160px 1fr;
          gap:0;
          align-items:start;
          animation: fadeUp 0.4s ease both;
        }
        .ss-cat-row:nth-child(1) { animation-delay:0.10s; }
        .ss-cat-row:nth-child(2) { animation-delay:0.17s; }
        .ss-cat-row:nth-child(3) { animation-delay:0.24s; }
        .ss-cat-row:nth-child(4) { animation-delay:0.31s; }
        .ss-cat-row:nth-child(5) { animation-delay:0.38s; }
        .ss-cat-row:nth-child(6) { animation-delay:0.45s; }

        /* Category label */
        .ss-cat-label-wrap {
          display:flex;
          align-items:flex-start;
          padding-top:0.6rem;
          padding-right:1.5rem;
          position:relative;
        }
        /* Horizontal connector line from label to nodes */
        .ss-cat-label-wrap::after {
          content:'';
          position:absolute;
          right:0;
          top:1.05rem;
          width:1.5rem;
          height:1px;
          background:var(--cat-colour);
          opacity:0.4;
        }
        .ss-cat-label {
          font-size:0.6875rem;
          font-weight:700;
          letter-spacing:0.08em;
          text-transform:uppercase;
          color:var(--cat-colour);
          line-height:1.3;
          text-align:right;
          width:100%;
        }

        /* Nodes container */
        .ss-nodes {
          display:flex;
          flex-wrap:wrap;
          gap:0.625rem;
          padding-left:1rem;
          border-left:1px solid var(--cat-colour);
          /* fade the border */
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
          padding-top:0.25rem;
          padding-bottom:0.25rem;
        }

        /* Individual node / pill */
        .ss-node {
          display:inline-flex;
          align-items:center;
          gap:0.4rem;
          padding:0.45rem 0.875rem;
          border-radius:999px;
          border:1px solid var(--cat-colour);
          background:transparent;
          color:hsl(var(--foreground));
          font-size:0.8125rem;
          font-weight:500;
          text-decoration:none;
          cursor:pointer;
          transition:background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
          white-space:nowrap;
          /* Subtle tint of category colour */
          background: color-mix(in srgb, var(--cat-colour) 6%, transparent);
        }
        .ss-node:hover {
          background: color-mix(in srgb, var(--cat-colour) 16%, transparent);
          transform:translateY(-2px);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--cat-colour) 20%, transparent);
          color:var(--cat-colour);
        }
        .ss-node-dot {
          width:5px; height:5px; border-radius:50%;
          background:var(--cat-colour); opacity:0.6; flex-shrink:0;
        }

        /* ── Legend / stats strip ── */
        .ss-stats {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:2rem;
          margin-top:3.5rem;
          padding-top:2rem;
          border-top:1px solid hsl(var(--border));
        }
        .ss-stat { text-align:center; }
        .ss-stat-num {
          font-size:1.5rem; font-weight:800; letter-spacing:-0.03em;
          background:linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)/0.6) 100%);
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
        }
        .ss-stat-label {
          font-size:0.6875rem; font-weight:600; letter-spacing:0.06em;
          text-transform:uppercase; color:hsl(var(--muted-foreground));
          margin-top:0.125rem;
        }
        .ss-stat-divider { width:1px; height:2rem; background:hsl(var(--border)); }

        @media (max-width:640px) {
          .ss-content { padding:2rem 1.25rem 5rem; }
          .ss-title { font-size:2rem; }
          .ss-cat-row { grid-template-columns:100px 1fr; }
          .ss-cat-label { font-size:0.625rem; }
          .ss-node { font-size:0.75rem; padding:0.375rem 0.75rem; }
        }
      `}</style>

      <div className="ss-page">
        <div className="ss-dot-grid" aria-hidden="true" />
        <div className="ss-glow" aria-hidden="true" />
        <div className="ss-noise" aria-hidden="true" />

        <div className="ss-content">

          {/* Header */}
          <header className="ss-header ss-anim-1">
            <div className="ss-eyebrow">
              <span className="ss-eyebrow-dot" />
              GUIDES + INFO
              <span className="ss-eyebrow-dot" />
            </div>
            <h1 className="ss-title">Sea Survival</h1>
            <p className="ss-subtitle">
              Core knowledge for every deck cadet — from life rafts to rescue procedures.
            </p>
          </header>

          {/* Mindmap */}
          <div className="ss-mindmap ss-anim-2" role="list" aria-label="Sea survival topics">

            {categories.map((cat, catIdx) => {
              const colour = categoryColour(catIdx);
              return (
                <div
                  key={cat}
                  className="ss-cat-row"
                  style={{ '--cat-colour': colour } as React.CSSProperties}
                  role="listitem"
                >
                  {/* Category label */}
                  <div className="ss-cat-label-wrap">
                    <span className="ss-cat-label">{cat}</span>
                  </div>

                  {/* Article nodes */}
                  <div className="ss-nodes">
                    {grouped[cat].map(article => (
                      <a
                        key={article.id}
                        href={`/sea-survival/${article.slug}`}
                        className="ss-node"
                        aria-label={article.title}
                      >
                        <span className="ss-node-dot" />
                        {article.title}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>

          {/* Stats strip */}
          <div className="ss-stats ss-anim-3">
            <div className="ss-stat">
              <div className="ss-stat-num">{articles.length}</div>
              <div className="ss-stat-label">Articles</div>
            </div>
            <div className="ss-stat-divider" />
            <div className="ss-stat">
              <div className="ss-stat-num">{categories.length}</div>
              <div className="ss-stat-label">Topics</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}