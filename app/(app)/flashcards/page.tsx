'use client';
// User-facing flashcard library.
// Drop in at app/flashcards/page.tsx
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen, Crown, Layers } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StudyShell } from '@/components/StudyShell';
import { ProgressRing } from '@/components/ProgressRing';
import { XPBar } from '@/components/XPBar';
import { usePacks, useCurrentUser, useUserXP } from '@/lib/hooks/useFlashcards';

const supabase = createClient();

const diffColor: Record<string, string> = {
  beginner: '#16a34a',
  intermediate: '#2966f4',
  advanced: '#dc2626',
};

export default function FlashcardLibraryPage() {
  const userId = useCurrentUser();
  const { xp } = useUserXP(userId);
  const { packs, loading, error } = usePacks();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [progressByPack, setProgressByPack] = useState<Record<string, { seen: number; mastered: number; total: number }>>({});

  useEffect(() => {
    if (!userId || packs.length === 0) return;
    supabase.from('flashcard_pack_stats').select('pack_id, cards_seen, cards_mastered')
      .eq('user_id', userId)
      .then(({ data }) => {
        const map: Record<string, { seen: number; mastered: number; total: number }> = {};
        (data ?? []).forEach((r) => {
          const p = packs.find((x) => x.id === r.pack_id);
          map[r.pack_id] = { seen: r.cards_seen, mastered: r.cards_mastered, total: p?.card_count ?? 1 };
        });
        setProgressByPack(map);
      });
  }, [userId, packs]);

  const cats = useMemo(() => ['All', ...Array.from(new Set(packs.map((p) => p.category)))], [packs]);
  const filtered = packs.filter((p) =>
    (cat === 'All' || p.category === cat) &&
    (q === '' || (p.title + ' ' + p.description + ' ' + p.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <StudyShell>
      <style>{`
        .fl-page { padding: 0; max-width: unset; }

        /* ── Header ── */
        .fl-header {
          text-align: center;
          padding: 2.5rem 1rem 2rem;
        }
        .fl-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: .12em;
          text-transform: uppercase; color: hsl(var(--primary));
          background: hsl(var(--primary) / .08);
          padding: 4px 12px; border-radius: 20px;
          margin-bottom: 14px;
        }
        .fl-title {
          font-size: clamp(1.4rem, 4vw, 2rem);
          font-weight: 800; letter-spacing: -.03em;
          line-height: 1.15; margin: 0 0 10px;
          color: hsl(var(--foreground));
        }
        .fl-subtitle {
          font-size: 13px; color: hsl(var(--muted-foreground));
          max-width: 420px; margin: 0 auto; line-height: 1.6;
        }

        /* ── Search ── */
        .fl-search-wrap {
          position: relative; max-width: 480px; margin: 0 auto 1.25rem;
        }
        .fl-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px;
          color: hsl(var(--muted-foreground)); pointer-events: none;
        }
        .fl-search {
          width: 100%; padding: 10px 14px 10px 40px;
          border-radius: 10px; font-size: 13px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
          font-family: inherit;
        }
        .fl-search:focus {
          border-color: hsl(var(--primary) / .5);
          box-shadow: 0 0 0 3px hsl(var(--primary) / .08);
        }

        /* ── Filter chips ── */
        .fl-chips {
          display: flex; flex-wrap: wrap; gap: 6px;
          justify-content: center; margin-bottom: 1.75rem;
        }
        .fl-chip {
          padding: 5px 14px; border-radius: 20px; font-size: 11px;
          font-weight: 600; cursor: pointer; border: 1px solid hsl(var(--border));
          background: hsl(var(--background)); color: hsl(var(--muted-foreground));
          font-family: inherit; transition: all .15s;
        }
        .fl-chip:hover { border-color: hsl(var(--primary) / .4); color: hsl(var(--primary)); }
        .fl-chip.on {
          background: hsl(var(--primary)); color: #fff;
          border-color: hsl(var(--primary)); font-weight: 700;
          -webkit-text-fill-color: currentColor;
        }

        /* ── Grid ── */
        .fl-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 900px) {
          .fl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .fl-grid { grid-template-columns: 1fr; }
        }

        /* ── Card ── */
        .fl-card {
          display: flex; flex-direction: column;
          border-radius: 14px; overflow: hidden;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card, var(--background)));
          text-decoration: none; color: inherit;
          transition: transform .18s, box-shadow .18s;
          box-shadow: 0 1px 3px hsl(var(--foreground) / .05);
        }
        .fl-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px hsl(var(--foreground) / .1);
        }

        /* Cover image */
        .fl-cover {
          height: 130px; position: relative; flex-shrink: 0;
          background-size: cover; background-position: center;
        }
        .fl-cover-fallback {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .fl-cover-initials {
          font-size: 44px; font-weight: 900; letter-spacing: -2px;
          opacity: .25;
        }
        /* gradient scrim at bottom of cover */
        .fl-cover::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 40%, hsl(var(--card, var(--background))) 100%);
          pointer-events: none;
        }

        /* Premium badge */
        .fl-premium-badge {
          position: absolute; top: 10px; right: 10px; z-index: 2;
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(245,158,11,.45);
        }

        /* Status dot */
        .fl-status {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          padding: 3px 8px; border-radius: 20px; font-size: 9px;
          font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
        }

        /* Body */
        .fl-body { padding: 10px 13px 0; flex: 1; }
        .fl-pills {
          display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px;
        }
        .fl-pill {
          padding: 2px 8px; border-radius: 20px; font-size: 10px;
          font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
        }
        .fl-card-title {
          font-size: 13px; font-weight: 700; line-height: 1.35;
          margin: 0 0 5px; color: hsl(var(--foreground));
        }
        .fl-card-desc {
          font-size: 11px; color: hsl(var(--muted-foreground));
          line-height: 1.55; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        /* Footer */
        .fl-footer {
          padding: 8px 13px 12px;
          display: flex; align-items: center; gap: 8px; margin-top: 8px;
        }
        .fl-count {
          font-size: 11px; color: hsl(var(--muted-foreground));
          display: flex; align-items: center; gap: 4px; flex: 1;
        }
        .fl-preview-tag {
          font-size: 10px; font-weight: 700;
          color: hsl(var(--primary)); letter-spacing: .04em;
          display: flex; align-items: center; gap: 3px;
        }

        /* Skeleton */
        .fl-skel {
          height: 230px; border-radius: 14px;
          background: hsl(var(--muted));
          animation: fl-pulse 1.4s ease-in-out infinite;
        }
        @keyframes fl-pulse {
          0%, 100% { opacity: 1 } 50% { opacity: .5 }
        }
      `}</style>

      <div className="fl-page">
        {/* ── Header ── */}
        <div className="fl-header bp-anim-1">
          <div className="fl-eyebrow">
            <BookOpen size={10} /> Flashcard Library
          </div>
          <h1 className="fl-title">Study smarter, not harder</h1>
          <p className="fl-subtitle">
            Spaced-repetition decks built for merchant navy training. Pick a pack and start a session.
          </p>
        </div>

        {/* ── XP bar ── */}
        {userId && (
          <div className="bp-anim-2" style={{ maxWidth: 480, margin: '0 auto 1.5rem' }}>
            <XPBar xp={xp} />
          </div>
        )}

        {/* ── Search ── */}
        <div className="fl-search-wrap bp-anim-2">
          <Search size={14} className="fl-search-icon" />
          <input
            className="fl-search"
            placeholder="Search packs, tags, topics…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* ── Category chips ── */}
        <div className="fl-chips bp-anim-3">
          {cats.map((c) => (
            <button key={c} className={`fl-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {/* ── Grid ── */}
        <div className="fl-grid bp-anim-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="fl-skel" style={{ opacity: 1 - i * 0.12 }} />
          ))}
          {!loading && error && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'hsl(var(--destructive))' }}>
              Failed to load: {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
              <BookOpen size={28} style={{ opacity: .3, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: 13 }}>No packs found.</p>
            </div>
          )}
          {!loading && filtered.map((p) => {
            const pr = progressByPack[p.id];
            const pct = pr && pr.total > 0 ? pr.mastered / pr.total : 0;
            const initials = p.title.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
            const coverStyle = p.thumbnail_url
              ? { backgroundImage: `url(${p.thumbnail_url})` }
              : { background: `linear-gradient(135deg, hsl(var(--primary) / .12), hsl(var(--primary) / .22))` };

            return (
              <Link key={p.id} href={`/flashcards/${p.slug}`} className="fl-card">
                {/* Cover */}
                <div className="fl-cover" style={coverStyle}>
                  {!p.thumbnail_url && (
                    <div className="fl-cover-fallback">
                      <span className="fl-cover-initials" style={{ color: 'hsl(var(--primary))' }}>{initials}</span>
                    </div>
                  )}
                  {/* Premium crown */}
                  {p.is_premium && (
                    <div className="fl-premium-badge">
                      <Crown size={14} color="#fff" />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="fl-body">
                  <div className="fl-pills">
                    <span className="fl-pill" style={{ background: 'hsl(var(--primary) / .1)', color: 'hsl(var(--primary))' }}>{p.category}</span>
                    <span className="fl-pill" style={{ background: diffColor[p.difficulty] + '18', color: diffColor[p.difficulty] }}>{p.difficulty}</span>
                    {p.is_premium && (
                      <span className="fl-pill" style={{ background: '#fef3c7', color: '#b45309' }}>
                        <Crown size={8} style={{ verticalAlign: 'text-top', marginRight: 2 }} />Premium
                      </span>
                    )}
                  </div>
                  <h3 className="fl-card-title">{p.title}</h3>
                  {p.description && <p className="fl-card-desc">{p.description}</p>}
                </div>

                {/* Footer */}
                <div className="fl-footer">
                  <span className="fl-count">
                    <Layers size={10} />
                    {p.card_count} cards
                  </span>
                  {p.is_premium && !pr && (
                    <span className="fl-preview-tag">
                      <Crown size={9} color="#f59e0b" /> Preview
                    </span>
                  )}
                  {pr && (
                    <ProgressRing value={pct} size={36} stroke={3} label={`${Math.round(pct * 100)}%`} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </StudyShell>
  );
}