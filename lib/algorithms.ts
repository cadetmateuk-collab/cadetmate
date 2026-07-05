// SM-2 spaced repetition + adaptive picker.
// Drop into app/flashcards/lib/algorithms.ts

import type { CardProgress, Flashcard, SessionCardState, StudyMode } from './types';

const DAY = 86_400_000;

export function sm2(p: CardProgress, quality: number): CardProgress {
  let { interval_days, repetitions, ease_factor } = p;
  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval_days = 1;
  }
  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );
  const times_viewed = p.times_viewed + 1;
  const times_correct = p.times_correct + (quality >= 3 ? 1 : 0);
  const mastery = Math.min(1, times_correct / Math.max(1, times_viewed));
  return {
    ...p,
    interval_days,
    repetitions,
    ease_factor,
    next_review: new Date(Date.now() + interval_days * DAY).toISOString(),
    last_quality: quality,
    times_viewed,
    times_correct,
    mastery,
  };
}

/** Forgetting-curve recovery: if user has been away for a long time,
 *  knock ease/intervals down so the algorithm re-tests them sooner. */
export function applyForgettingCurve(p: CardProgress): CardProgress {
  const daysAway = (Date.now() - new Date(p.next_review).getTime()) / DAY;
  if (daysAway < 14) return p;
  return {
    ...p,
    ease_factor: Math.max(1.3, p.ease_factor - 0.3),
    interval_days: Math.max(1, Math.floor(p.interval_days / 2)),
  };
}

export function initProgress(card: Flashcard, userId: string): CardProgress {
  return {
    user_id: userId,
    card_id: card.id,
    pack_id: card.pack_id,
    interval_days: 0,
    repetitions: 0,
    ease_factor: 2.5,
    next_review: new Date().toISOString(),
    last_quality: null,
    times_viewed: 0,
    times_correct: 0,
    mastery: 0,
  };
}

export function pickNext(
  states: SessionCardState[],
  mode: StudyMode,
  excludeId?: string,
): SessionCardState | null {
  if (states.length === 0) return null;
  const pool = states.filter((s) => s.card.id !== excludeId);
  if (pool.length === 0) return states[0];

  switch (mode) {
    case 'exam_cram': {
      // weakest first: low mastery, low ease
      const weak = [...pool].sort(
        (a, b) => a.progress.mastery - b.progress.mastery || a.progress.ease_factor - b.progress.ease_factor,
      );
      return weak[0];
    }
    case 'smart_review': {
      const due = pool.filter((s) => new Date(s.progress.next_review).getTime() <= Date.now());
      if (due.length === 0)
        return [...pool].sort(
          (a, b) => new Date(a.progress.next_review).getTime() - new Date(b.progress.next_review).getTime(),
        )[0];
      const fresh = due.filter((s) => s.progress.repetitions === 0);
      if (fresh.length) return fresh[Math.floor(Math.random() * Math.min(3, fresh.length))];
      return due.sort((a, b) => a.progress.ease_factor - b.progress.ease_factor)[0];
    }
    case 'quick_fire':
    case 'survival':
    case 'match':
    case 'standard':
    default:
      return pool[Math.floor(Math.random() * pool.length)];
  }
}

// ─── Gamification: XP + ranks ──────────────────────────────────────────────
export const RANKS: { name: string; xp: number }[] = [
  { name: 'Cadet',              xp: 0 },
  { name: 'Officer of the Watch', xp: 500 },
  { name: 'Second Officer',     xp: 1500 },
  { name: 'Chief Officer',      xp: 4000 },
  { name: 'Master Mariner',     xp: 10000 },
];

export function rankForXP(xp: number): { current: string; next: string | null; toNext: number; pct: number } {
  let current = RANKS[0];
  let next: typeof RANKS[number] | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) current = RANKS[i];
    if (RANKS[i].xp > xp) { next = RANKS[i]; break; }
  }
  const toNext = next ? next.xp - xp : 0;
  const span = next ? next.xp - current.xp : 1;
  const pct = next ? Math.max(0, Math.min(1, (xp - current.xp) / span)) : 1;
  return { current: current.name, next: next?.name ?? null, toNext, pct };
}

export const XP_PER_CORRECT = 10;
export const XP_BONUS_PERFECT = 50;
export const XP_BONUS_STREAK = 5;

export function computeCardXP(isCorrect: boolean, streakAfter: number): number {
  if (!isCorrect) return 0;
  let xp = XP_PER_CORRECT;
  if (streakAfter > 0 && streakAfter % 3 === 0) xp += XP_BONUS_STREAK;
  return xp;
}

export function computeSessionBonus(ok: number, total: number): number {
  return ok === total && total > 0 ? XP_BONUS_PERFECT : 0;
}

export function computeBulkSessionXP(ok: number, total: number, streak: number): number {
  return ok * XP_PER_CORRECT
    + computeSessionBonus(ok, total)
    + Math.floor(streak / 3) * XP_BONUS_STREAK;
}
