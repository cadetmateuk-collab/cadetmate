import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { AVATAR_PRESETS, TRAINING_PHASES, REFERRAL_SOURCES } from '@/lib/onboarding/constants';

type Body = {
  full_name?: string;
  training_phase?: string;
  nautical_college?: string;
  learning_interests?: string[];
  referral_source?: string;
  avatar_kind?: 'initials' | 'preset';
  avatar_preset?: string | null;
  phone_number?: string | null;
  whatsapp_opt_in?: boolean;
};

const PHASE_IDS = new Set(TRAINING_PHASES.map((p) => p.id));
const REFERRAL_IDS = new Set(REFERRAL_SOURCES.map((r) => r.id));
const PRESET_IDS = new Set(AVATAR_PRESETS.map((a) => a.id));

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const fullName = body.full_name?.trim() ?? '';
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: 'Full name required' }, { status: 400 });
  }

  const trainingPhase = body.training_phase?.trim() ?? '';
  if (!trainingPhase || !PHASE_IDS.has(trainingPhase as never)) {
    return NextResponse.json({ error: 'Invalid training phase' }, { status: 400 });
  }

  const nauticalCollege = body.nautical_college?.trim() ?? '';
  if (!nauticalCollege) {
    return NextResponse.json({ error: 'Nautical college required' }, { status: 400 });
  }

  const interests = Array.isArray(body.learning_interests)
    ? body.learning_interests.filter((x): x is string => typeof x === 'string')
    : [];
  if (interests.length === 0) {
    return NextResponse.json({ error: 'Select at least one interest' }, { status: 400 });
  }

  const referralSource = body.referral_source?.trim() ?? '';
  if (!referralSource || !REFERRAL_IDS.has(referralSource as never)) {
    return NextResponse.json({ error: 'Invalid referral source' }, { status: 400 });
  }

  const avatarKind = body.avatar_kind === 'preset' ? 'preset' : 'initials';
  let avatarPreset: string | null = null;
  if (avatarKind === 'preset') {
    const preset = body.avatar_preset?.trim() ?? '';
    if (!preset || !PRESET_IDS.has(preset as never)) {
      return NextResponse.json({ error: 'Invalid avatar preset' }, { status: 400 });
    }
    avatarPreset = preset;
  }

  const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : '';
  const whatsappOptIn = Boolean(body.whatsapp_opt_in && phoneNumber);

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      training_phase: trainingPhase,
      nautical_college: nauticalCollege,
      learning_interests: interests,
      referral_source: referralSource,
      avatar_kind: avatarKind,
      avatar_preset: avatarPreset,
      phone_number: phoneNumber || null,
      whatsapp_opt_in: whatsappOptIn,
      onboarding_completed: true,
    })
    .eq('id', auth.user.id);

  if (error) {
    console.error('[complete-onboarding]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep auth metadata in sync for clients that read user_metadata.
  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      training_phase: trainingPhase,
      nautical_college: nauticalCollege,
      learning_interests: interests,
      referral_source: referralSource,
      avatar_kind: avatarKind,
      avatar_preset: avatarPreset,
      phone_number: phoneNumber || null,
      whatsapp_opt_in: whatsappOptIn,
      onboarding_completed: true,
    },
  });

  return NextResponse.json({ ok: true });
}
