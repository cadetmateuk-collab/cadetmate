import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/navigation/types';

/**
 * Award XP and optionally create a notification for the user.
 * Gracefully no-ops if gamification tables are not yet migrated.
 */
export async function awardXP(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason?: string,
) {
  try {
    const { data: existing } = await supabase
      .from('user_gamification')
      .select('total_xp, level')
      .eq('user_id', userId)
      .maybeSingle();

    const newXp = (existing?.total_xp ?? 0) + amount;
    const newLevel = Math.floor(newXp / 500) + 1;

    await supabase.from('user_gamification').upsert({
      user_id: userId,
      total_xp: newXp,
      level: newLevel,
      updated_at: new Date().toISOString(),
    });

    if (reason) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'xp_earned',
        title: `+${amount} XP earned`,
        body: reason,
        href: '/progress',
      });
    }
  } catch {
    // Tables may not exist yet — fail silently
  }
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
