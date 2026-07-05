'use client';
// Data hooks for flashcard packs / cards / progress / xp.
// Drop into app/flashcards/lib/useFlashcards.ts

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  CardProgress, Flashcard, FlashcardPack, PackStats, UserXP, SessionCardState,
} from './types';
import { initProgress, applyForgettingCurve, rankForXP } from './algorithms';

const supabase = createClient();

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return userId;
}

export function usePacks() {
  const [packs, setPacks] = useState<FlashcardPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcard_packs').select('*')
        .eq('status', 'published').order('updated_at', { ascending: false });
      if (error) setError(error.message); else setPacks((data ?? []) as FlashcardPack[]);
      setLoading(false);
    })();
  }, []);
  return { packs, loading, error };
}

export function usePack(slug: string) {
  const [pack, setPack] = useState<FlashcardPack | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: p, error: pe } = await supabase
        .from('flashcard_packs').select('*').eq('slug', slug).maybeSingle();
      if (pe || !p) { setError(pe?.message ?? 'Pack not found'); setLoading(false); return; }
      setPack(p as FlashcardPack);

      let list: Flashcard[] = [];
      if (p.storage_path) {
        // Load card content from Storage JSON
        const { data: file } = await supabase.storage.from('flashcards').download(p.storage_path);
        if (file) {
          const json = JSON.parse(await file.text());
          list = (json.cards ?? []).map((c: any, i: number): Flashcard => ({
            id: c.id ?? `${p.id}:${i}`,
            pack_id: p.id,
            position: c.position ?? i,
            card_type: c.card_type ?? 'standard',
            front: c.front,
            back: c.back,
            hint: c.hint ?? null,
            image_url: c.image_url ?? null,
            options: c.options ?? null,
            tags: c.tags ?? [],
            difficulty: c.difficulty ?? 'beginner',
          }));
        }
      } else {
        const { data: rows } = await supabase
          .from('flashcards').select('*').eq('pack_id', p.id).order('position');
        list = (rows ?? []) as Flashcard[];
      }
      // Expand "reverse" cards
      const expanded: Flashcard[] = [];
      for (const c of list) {
        expanded.push(c);
        if (c.card_type === 'reverse')
          expanded.push({ ...c, id: c.id + ':rev', front: c.back, back: c.front, card_type: 'standard' });
      }
      setCards(expanded);
      setLoading(false);
    })();
  }, [slug]);

  return { pack, cards, loading, error };
}

export async function loadOwnership(userId: string, packId: string): Promise<boolean> {
  const { data } = await supabase
    .from('flashcard_pack_ownership').select('pack_id').eq('user_id', userId).eq('pack_id', packId).maybeSingle();
  return !!data;
}

export async function loadProgress(userId: string, packId: string, cards: Flashcard[]): Promise<SessionCardState[]> {
  const { data } = await supabase
    .from('flashcard_progress').select('*').eq('user_id', userId).eq('pack_id', packId);
  const map = new Map<string, CardProgress>();
  (data ?? []).forEach((p: any) => map.set(p.card_id, p as CardProgress));
  return cards.map((c) => {
    const raw = map.get(c.id) ?? initProgress(c, userId);
    return { card: c, progress: applyForgettingCurve(raw) };
  });
}

export async function saveProgress(p: CardProgress) {
  // upsert (composite key user_id+card_id)
  await supabase.from('flashcard_progress').upsert(p, { onConflict: 'user_id,card_id' });
}

export async function bumpPackStats(userId: string, packId: string, deltaSec: number, correct: number, total: number) {
  const { data: cur } = await supabase
    .from('flashcard_pack_stats').select('*').eq('user_id', userId).eq('pack_id', packId).maybeSingle();
  const seen = (cur?.cards_seen ?? 0) + total;
  const reviews = (cur?.reviews_completed ?? 0) + total;
  const acc = reviews === 0 ? 0 : (((cur?.accuracy ?? 0) * (cur?.reviews_completed ?? 0)) + correct) / reviews;
  await supabase.from('flashcard_pack_stats').upsert({
    user_id: userId, pack_id: packId,
    cards_seen: seen,
    cards_mastered: cur?.cards_mastered ?? 0,
    accuracy: Number(acc.toFixed(3)),
    time_spent_sec: (cur?.time_spent_sec ?? 0) + deltaSec,
    reviews_completed: reviews,
    last_studied_at: new Date().toISOString(),
  }, { onConflict: 'user_id,pack_id' });
}

export async function addXP(
  userId: string,
  gained: number,
  opts?: { reviews?: number; timeSec?: number },
): Promise<{ xp: number; gained: number; rank: string; streak: number } | null> {
  const reviews = opts?.reviews ?? 0;
  const timeSec = opts?.timeSec ?? 0;
  if (gained <= 0 && reviews <= 0 && timeSec <= 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data: cur } = await supabase.from('flashcard_user_xp').select('*').eq('user_id', userId).maybeSingle();
  const last = cur?.last_study_day ? new Date(cur.last_study_day) : null;
  const todayD = new Date(today);
  let streak = cur?.current_streak ?? 0;
  if (reviews > 0 || gained > 0) {
    if (!last) streak = 1;
    else {
      const diff = Math.round((todayD.getTime() - last.getTime()) / 86400000);
      if (diff === 0) streak = streak || 1;
      else if (diff === 1) streak += 1;
      else streak = 1;
    }
  }

  const xp = (cur?.xp ?? 0) + gained;
  const rank = rankForXP(xp).current;
  const totalTime = (cur?.total_time_sec ?? 0) + timeSec;

  await supabase.from('flashcard_user_xp').upsert({
    user_id: userId,
    xp,
    rank,
    current_streak: streak,
    longest_streak: Math.max(cur?.longest_streak ?? 0, streak),
    last_study_day: reviews > 0 || gained > 0 ? today : cur?.last_study_day ?? today,
    total_time_sec: totalTime,
  }, { onConflict: 'user_id' });

  if (gained > 0 || reviews > 0) {
    const { data: dayRow } = await supabase
      .from('flashcard_study_days')
      .select('xp_earned, reviews')
      .eq('user_id', userId)
      .eq('day', today)
      .maybeSingle();

    await supabase.from('flashcard_study_days').upsert({
      user_id: userId,
      day: today,
      xp_earned: (dayRow?.xp_earned ?? 0) + gained,
      reviews: (dayRow?.reviews ?? 0) + reviews,
    }, { onConflict: 'user_id,day' });
  }

  return { xp, gained, rank, streak };
}

export function usePackStats(userId: string | null, packId?: string) {
  const [stats, setStats] = useState<PackStats | null>(null);
  const refresh = useCallback(async () => {
    if (!userId || !packId) return;
    const { data } = await supabase
      .from('flashcard_pack_stats').select('*').eq('user_id', userId).eq('pack_id', packId).maybeSingle();
    setStats((data ?? null) as PackStats | null);
  }, [userId, packId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { stats, refresh };
}

export function useUserXP(userId: string | null) {
  const [xp, setXP] = useState<UserXP | null>(null);
  const refresh = useCallback(async () => {
    if (!userId) { setXP(null); return; }
    const { data } = await supabase.from('flashcard_user_xp').select('*').eq('user_id', userId).maybeSingle();
    setXP((data ?? null) as UserXP | null);
  }, [userId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { xp, refresh };
}
