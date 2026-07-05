'use client';
// Study session page — handles all study modes.
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { StudyShell } from '@/components/StudyShell';
import { FlashcardView } from '@/components/Flashcard';
import { MatchGame } from '@/components/MatchGame';
import { QuickFire } from '@/components/QuickFire';
import { Survival } from '@/components/Survival';
import { XPBar } from '@/components/XPBar';
import {
  usePack, useCurrentUser, loadProgress, saveProgress, bumpPackStats, addXP, useUserXP,
} from '@/lib/useFlashcards';
import {
  sm2, pickNext, computeCardXP, computeSessionBonus, computeBulkSessionXP,
} from '@/lib/algorithms';
import type { SessionCardState, StudyMode } from '@/lib/types';

const RATINGS = [
  { q: 0, label: 'Blackout', em: '💀', cls: 'q0' },
  { q: 2, label: 'Hard',     em: '😓', cls: 'q2' },
  { q: 4, label: 'Good',     em: '✅', cls: 'q4' },
  { q: 5, label: 'Easy',     em: '⚡', cls: 'q5' },
] as const;

const SESSION_GOAL = 12;
const BULK_MODES = new Set<StudyMode>(['match', 'quick_fire', 'survival']);

export default function StudyPage() {
  const { slug } = useParams() as { slug: string };
  const search = useSearchParams();
  const router = useRouter();
  const mode = (search?.get('mode') as StudyMode) ?? 'standard';
  const userId = useCurrentUser();
  const { xp, refresh: refreshXp } = useUserXP(userId);
  const { pack, cards, loading } = usePack(slug);

  const [states, setStates] = useState<SessionCardState[]>([]);
  const [current, setCurrent] = useState<SessionCardState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [lastXpPop, setLastXpPop] = useState<number | null>(null);
  const startRef = useRef(Date.now());
  const xpAwardedRef = useRef(0);

  // Load progress
  useEffect(() => {
    if (!pack || cards.length === 0) return;
    (async () => {
      const s = userId
        ? await loadProgress(userId, pack.id, cards)
        : cards.map((c) => ({ card: c, progress: {
            user_id: '', card_id: c.id, pack_id: pack.id,
            interval_days: 0, repetitions: 0, ease_factor: 2.5,
            next_review: new Date().toISOString(), last_quality: null,
            times_viewed: 0, times_correct: 0, mastery: 0,
          }}));
      setStates(s);
      setCurrent(pickNext(s, mode));
    })();
  }, [pack, cards, userId, mode]);

  // Keyboard shortcuts (standard/smart/cram modes)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !current) return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped) {
        if (e.key === '1') rate(0);
        if (e.key === '2') rate(2);
        if (e.key === '3') rate(4);
        if (e.key === '4') rate(5);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, current, done]);

  async function awardXp(gained: number, reviews = 0, timeSec = 0) {
    if (!userId || (gained <= 0 && reviews <= 0 && timeSec <= 0)) return;
    await addXP(userId, gained, { reviews, timeSec });
    if (gained > 0) {
      xpAwardedRef.current += gained;
      setSessionXp((n) => n + gained);
      setLastXpPop(gained);
      setTimeout(() => setLastXpPop(null), 1200);
    }
    refreshXp();
  }

  async function rate(quality: number) {
    if (!current) return;
    const next = sm2(current.progress, quality);
    setStates((ss) => ss.map((s) => (s.card.id === current.card.id ? { ...s, progress: next } : s)));
    if (userId) await saveProgress({ ...next, user_id: userId });
    const isOk = quality >= 3;
    const nextStreak = isOk ? streak + 1 : 0;
    setCorrect((c) => c + (isOk ? 1 : 0));
    setStreak(nextStreak);
    setReviewed((n) => n + 1);
    setFlipped(false);

    if (userId) {
      const cardXp = computeCardXP(isOk, nextStreak);
      await awardXp(cardXp, 1);
    }

    if (reviewed + 1 >= SESSION_GOAL || quality < 3 && mode === 'survival') {
      await finish(reviewed + 1, correct + (isOk ? 1 : 0), nextStreak);
      return;
    }
    const updated = states.map((s) => (s.card.id === current.card.id ? { ...s, progress: next } : s));
    setCurrent(pickNext(updated, mode, current.card.id));
  }

  async function finish(total: number, ok: number, finalStreak = streak) {
    setDone(true);
    if (!userId || !pack) return;
    const sec = Math.round((Date.now() - startRef.current) / 1000);
    await bumpPackStats(userId, pack.id, sec, ok, total);

    if (BULK_MODES.has(mode) && xpAwardedRef.current === 0) {
      const bulk = computeBulkSessionXP(ok, total, finalStreak);
      await awardXp(bulk, total, sec);
    } else {
      const bonus = computeSessionBonus(ok, total);
      if (bonus > 0) await awardXp(bonus, 0, sec);
      else await awardXp(0, 0, sec);
    }
  }

  const pct = reviewed / SESSION_GOAL;
  const modeLabel = useMemo(() => mode.replace('_', ' '), [mode]);

  const xpHeader = userId ? (
    <div style={{ marginBottom: '1.25rem' }}>
      <XPBar xp={xp} />
    </div>
  ) : null;

  const celebrate = done ? (
    <div className="fc-celebrate">
      <span className="em">{correct === reviewed ? '🏆' : correct / Math.max(1, reviewed) > 0.7 ? '🎉' : '👍'}</span>
      <h2>Session complete</h2>
      <p>{correct} of {reviewed} correct{streak > 0 ? ` · streak ${streak}` : ''}</p>
      {sessionXp > 0 && <span className="fc-xp-badge">+{sessionXp} XP earned</span>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="fc-btn fc-btn-skip" onClick={() => router.push(`/flashcards/${slug}`)} style={{ flex: 'none', padding: '10px 18px' }}>Done</button>
        <button className="fc-btn fc-btn-flip" onClick={() => location.reload()} style={{ flex: 'none', padding: '10px 22px' }}>Study more</button>
      </div>
    </div>
  ) : null;

  // ── Specialised modes ─────────────────────────────────────────
  if (mode === 'match') {
    return (
      <StudyShell>
        <Link href={`/flashcards/${slug}`} className="bp-back"><ChevronLeft size={12} /> Back</Link>
        {xpHeader}
        {celebrate ?? (
          <>
            <h1 className="bp-title" style={{ fontSize: '1.6rem' }}>Match</h1>
            {states.length > 0 && (
              <MatchGame cards={states.map((s) => s.card)}
                onComplete={(c, t) => { setCorrect(c); setReviewed(t); finish(t, c); }} />
            )}
          </>
        )}
      </StudyShell>
    );
  }
  if (mode === 'quick_fire') {
    return (
      <StudyShell>
        <Link href={`/flashcards/${slug}`} className="bp-back"><ChevronLeft size={12} /> Back</Link>
        {xpHeader}
        {celebrate ?? (
          <>
            <h1 className="bp-title" style={{ fontSize: '1.6rem' }}>Quick Fire</h1>
            {states.length > 0 && (
              <QuickFire cards={states.map((s) => s.card)}
                onDone={(c, t) => { setCorrect(c); setReviewed(t); finish(t, c); }} />
            )}
          </>
        )}
      </StudyShell>
    );
  }
  if (mode === 'survival') {
    return (
      <StudyShell>
        <Link href={`/flashcards/${slug}`} className="bp-back"><ChevronLeft size={12} /> Back</Link>
        {xpHeader}
        {celebrate ?? (
          <>
            <h1 className="bp-title" style={{ fontSize: '1.6rem' }}>Survival</h1>
            {states.length > 0 && (
              <Survival cards={states.map((s) => s.card)} onDone={(n) => { setReviewed(n); setCorrect(n); finish(n, n); }} />
            )}
          </>
        )}
      </StudyShell>
    );
  }

  // ── Standard / smart / cram (SM-2 loop) ───────────────────────
  return (
    <StudyShell>
      <Link href={`/flashcards/${slug}`} className="bp-back"><ChevronLeft size={12} /> Back</Link>

      {xpHeader}

      {pack && (
        <>
          <span className="bp-cat-badge">{pack.category} · {modeLabel}</span>
          <h1 className="bp-title" style={{ fontSize: '1.6rem' }}>{pack.title}</h1>
          <hr className="bp-divider" />
        </>
      )}

      {done ? celebrate : loading || !current ? (
        <div className="bp-loading"><div className="bp-spinner" /><span>Preparing your session…</span></div>
      ) : (
        <>
          <div className="fc-prog">
            <div className="fc-prog-meta">
              <span>{reviewed} / {SESSION_GOAL}</span>
              <span>🔥 streak {streak}{sessionXp > 0 ? ` · ${sessionXp} XP` : ''}</span>
            </div>
            <div className="fc-prog-track"><div className="fc-prog-fill" style={{ width: `${pct * 100}%` }} /></div>
          </div>

          <FlashcardView card={current.card} flipped={flipped}
            onFlip={() => setFlipped((f) => !f)} category={pack?.category} />

          {lastXpPop && <div className="fc-xp-pop">+{lastXpPop} XP</div>}

          {!flipped ? (
            <div className="fc-actions">
              <button className="fc-btn fc-btn-skip" onClick={() => { const nx = pickNext(states, mode, current.card.id); setCurrent(nx); }}>
                Skip
              </button>
              <button className="fc-btn fc-btn-flip" onClick={() => setFlipped(true)}>Reveal answer</button>
            </div>
          ) : (
            <>
              <div className="fc-rlbl">How well did you recall it?</div>
              <div className="fc-ratings">
                {RATINGS.map((r) => (
                  <button key={r.q} className={`fc-rbtn ${r.cls}`} onClick={() => rate(r.q)}>
                    <span className="em">{r.em}</span>{r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </StudyShell>
  );
}
