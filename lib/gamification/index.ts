import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/navigation/types';
import { rankForXP } from '@/lib/algorithms';

/**
 * Award / sync platform XP on user_gamification (canonical total).
 * Optionally creates an in-app notification when prefs allow.
 */
export async function awardXP(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason?: string,
  opts?: { absoluteTotal?: number },
) {
  try {
    let newXp: number;

    if (typeof opts?.absoluteTotal === 'number') {
      newXp = opts.absoluteTotal;
    } else {
      const { data: existing } = await supabase
        .from('user_gamification')
        .select('total_xp, level')
        .eq('user_id', userId)
        .maybeSingle();
      newXp = (existing?.total_xp ?? 0) + amount;
    }

    const newLevel = Math.floor(newXp / 500) + 1;

    await supabase.from('user_gamification').upsert({
      user_id: userId,
      total_xp: newXp,
      level: newLevel,
      updated_at: new Date().toISOString(),
    });

    if (reason && amount > 0) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('in_app_xp')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefs?.in_app_xp !== false) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'xp_earned',
          title: `+${amount} XP`,
          body: reason,
          href: '/progress',
        });
      }
    }

    return { xp: newXp, level: newLevel, rank: rankForXP(newXp).current };
  } catch {
    return null;
  }
}

/** Prefer platform XP; fall back to legacy flashcard XP. Never sum both. */
export function unifiedTotalXp(
  gamificationXp: number | null | undefined,
  flashcardXp: number | null | undefined,
): number {
  if (typeof gamificationXp === 'number' && gamificationXp > 0) return gamificationXp;
  if (typeof gamificationXp === 'number' && typeof flashcardXp === 'number') {
    return Math.max(gamificationXp, flashcardXp);
  }
  return flashcardXp ?? gamificationXp ?? 0;
}

export function levelFromXP(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export type GamificationContext = {
  role: UserRole;
  isPremium: boolean;
};

export function getGamificationContext(role?: string): GamificationContext {
  const r = (role as UserRole) ?? 'free';
  return {
    role: r,
    isPremium: r === 'premium' || r === 'admin',
  };
}
