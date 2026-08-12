import { createClient } from '@/lib/supabase/server';

type OnboardingMeta = {
  full_name?: string;
  training_phase?: string;
  nautical_college?: string;
  learning_interests?: string[];
  referral_source?: string;
  avatar_kind?: 'initials' | 'preset';
  avatar_preset?: string | null;
  phone_number?: string | null;
  whatsapp_opt_in?: boolean;
  onboarding_completed?: boolean;
};

/**
 * If the user finished onboarding before email confirm (no session),
 * metadata is on auth.users. Sync once when they first have a session
 * and the profile row is still incomplete.
 */
export async function syncOnboardingFromMetadata(userId: string, metadata: OnboardingMeta | undefined) {
  if (!metadata?.onboarding_completed && !metadata?.training_phase) return;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  // If the column/query fails or onboarding is already done, never write again.
  if (error || profile?.onboarding_completed) return;

  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  if (!fullName) return;

  const phone =
    typeof metadata.phone_number === 'string' && metadata.phone_number.trim()
      ? metadata.phone_number.trim()
      : null;

  await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      training_phase: metadata.training_phase ?? null,
      nautical_college: metadata.nautical_college ?? null,
      learning_interests: Array.isArray(metadata.learning_interests) ? metadata.learning_interests : [],
      referral_source: metadata.referral_source ?? null,
      avatar_kind: metadata.avatar_kind === 'preset' ? 'preset' : 'initials',
      avatar_preset: metadata.avatar_kind === 'preset' ? (metadata.avatar_preset ?? null) : null,
      phone_number: phone,
      whatsapp_opt_in: Boolean(metadata.whatsapp_opt_in && phone),
      onboarding_completed: true,
    })
    .eq('id', userId);
}
