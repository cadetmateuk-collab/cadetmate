'use client';
// Pack detail page with mode picker + Stripe premium gate.
// Drop in at app/flashcards/[slug]/page.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, Lock, Zap, Brain, Flame, Heart, Target, Shuffle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StudyShell } from '@/components/StudyShell';
import { ProgressRing } from '@/components/ProgressRing';
import { usePack, useCurrentUser, usePackStats, loadOwnership } from '@/lib/useFlashcards';
import type { StudyMode } from '@/lib/types';

const supabase = createClient();

const MODES: { key: StudyMode; em: string; title: string; sub: string; icon: any }[] = [
  { key: 'standard',     em: '📖', title: 'Standard',       sub: 'Flip through cards at your own pace',       icon: Shuffle },
  { key: 'smart_review', em: '🧠', title: 'Smart Review',   sub: 'Spaced repetition (SM-2). Due cards first',  icon: Brain },
  { key: 'exam_cram',    em: '🔥', title: 'Exam Cram',      sub: 'Weakest cards on repeat',                    icon: Flame },
  { key: 'match',        em: '🎯', title: 'Match',          sub: 'Match terms to definitions',                 icon: Target },
  { key: 'quick_fire',   em: '⚡', title: 'Quick Fire',     sub: '60-second timed challenge',                  icon: Zap },
  { key: 'survival',     em: '🛟', title: 'Survival',       sub: '3 lives, no second chances',                 icon: Heart },
];

export default function PackDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const userId = useCurrentUser();
  const { pack, cards, loading, error } = usePack(slug);
  const { stats } = usePackStats(userId, pack?.id);
  const [owned, setOwned] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);

  useEffect(() => {
    if (userId && pack) loadOwnership(userId, pack.id).then(setOwned);
  }, [userId, pack]);

  // Handle return from Stripe Checkout (success=1 query param)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      setJustPurchased(true);
      setOwned(true);
      // Clean up the URL without a hard reload
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
  }, []);

  const locked = pack?.is_premium && !owned;
  const pct = stats && pack ? stats.cards_mastered / Math.max(1, pack.card_count) : 0;

  async function unlock() {
    if (!userId) {
      // Not logged in — redirect to sign in
      router.push(`/auth?redirectTo=${encodeURIComponent(`/flashcards/${slug}`)}`);
      return;
    }
    if (!pack) return;

    // Free premium pack — unlock directly without Stripe
    if (!pack.price_cents || pack.price_cents === 0) {
      await supabase
        .from('flashcard_pack_ownership')
        .insert({ user_id: userId, pack_id: pack.id, source: 'free_unlock' });
      setOwned(true);
      return;
    }

    // Paid pack — create Stripe Checkout session
    setPurchasing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          priceId: pack.stripe_price_id,   // column you added to flashcard_packs
          slug,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        alert(error ?? 'Could not start checkout. Please try again.');
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url; // redirect to Stripe-hosted checkout
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  function start(mode: StudyMode) {
    if (locked) return;
    router.push(`/flashcards/${slug}/study?mode=${mode}`);
  }

  return (
    <StudyShell>
      <Link href="/flashcards" className="bp-back"><ChevronLeft size={12} /> Library</Link>

      {loading && (
        <div className="bp-loading" style={{ padding: '4rem 0' }}>
          <div className="bp-spinner" /><span>Loading pack…</span>
        </div>
      )}
      {error && <div className="bp-error">{error}</div>}

      {pack && (
        <div className="bp-anim-1">

          {/* Post-purchase success banner */}
          {justPurchased && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 12, marginBottom: 20,
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1px solid #86efac', color: '#15803d',
            }}>
              <CheckCircle size={18} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Pack unlocked!</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>You now have full access to all {pack.card_count} cards.</div>
              </div>
            </div>
          )}

          <span className="bp-cat-badge">{pack.category}</span>
          {pack.is_premium && (
            <span className="bp-cat-badge" style={{ marginLeft: 8, background: 'linear-gradient(135deg,#fef3c7,#fcd34d)', color: '#92400e' }}>
              <Sparkles size={10} style={{ verticalAlign: 'text-top' }} /> Premium
            </span>
          )}
          <h1 className="bp-title">{pack.title}</h1>
          <p className="bp-subtitle">{pack.description}</p>
          <hr className="bp-divider" style={{ marginTop: '1.75rem' }} />

          {/* Progress + stats */}
          {stats && (
            <div className="fc-stats bp-anim-2">
              <div className="fc-stat"><div className="fc-sv b">{Math.round(pct * 100)}%</div><div className="fc-sl">Mastered</div></div>
              <div className="fc-stat"><div className="fc-sv">{stats.cards_seen}</div><div className="fc-sl">Seen</div></div>
              <div className="fc-stat"><div className="fc-sv g">{Math.round(stats.accuracy * 100)}%</div><div className="fc-sl">Accuracy</div></div>
              <div className="fc-stat"><div className="fc-sv">{Math.round(stats.time_spent_sec / 60)}m</div><div className="fc-sl">Time</div></div>
            </div>
          )}

          {/* Mode picker (or premium gate) */}
          {locked ? (
            <div className="bp-anim-3" style={{
              padding: '28px 22px', borderRadius: 18,
              background: 'linear-gradient(135deg, hsl(var(--primary)/.06), hsl(var(--primary)/.02))',
              border: '1px solid hsl(var(--primary)/.2)', textAlign: 'center',
            }}>
              <Lock size={28} style={{ color: 'hsl(var(--primary))', marginBottom: 10 }} />
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 6px', fontWeight: 700 }}>Premium pack</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.92rem', margin: '0 0 16px' }}>
                Unlock {pack.card_count} cards and full progress tracking across devices.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="fc-btn fc-btn-skip" onClick={() => router.push('/flashcards')} style={{ flex: 'none', padding: '10px 18px' }}>
                  Browse free packs
                </button>
                <button
                  className="fc-btn fc-btn-flip"
                  onClick={unlock}
                  disabled={purchasing}
                  style={{ flex: 'none', padding: '10px 22px', opacity: purchasing ? 0.7 : 1 }}
                >
                  {purchasing
                    ? 'Redirecting…'
                    : pack.price_cents > 0
                      ? `Buy · £${(pack.price_cents / 100).toFixed(2)}`
                      : 'Unlock free'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 14 }}>
                Preview: first {Math.min(3, cards.length)} cards available below.
              </p>
            </div>
          ) : (
            <div className="fc-modes bp-anim-3">
              {MODES.map((m) => (
                <button key={m.key} className="fc-mode" onClick={() => start(m.key)}>
                  <span className="fc-mode-em">{m.em}</span>
                  <div className="fc-mode-title">{m.title}</div>
                  <div className="fc-mode-sub">{m.sub}</div>
                </button>
              ))}
            </div>
          )}

          {/* Preview / card list */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '2rem 0 10px' }}>
            {locked ? 'Preview' : 'Cards'}{' '}
            <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>({cards.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(locked ? cards.slice(0, 3) : cards).map((c, i) => (
              <div key={c.id} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'hsl(var(--card, var(--background))/.85)',
                border: '1px solid hsl(var(--border))', fontSize: 13, lineHeight: 1.5,
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', minWidth: 24, fontWeight: 600 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{c.front}</span>
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>→</span>
                <span style={{ flex: 1, color: 'hsl(var(--muted-foreground))' }}>{c.back}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </StudyShell>
  );
}