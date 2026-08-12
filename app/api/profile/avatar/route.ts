import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AVATAR_PRESETS, isValidAvatarColor } from '@/lib/onboarding/constants';

const PRESET_IDS = new Set(AVATAR_PRESETS.map((p) => p.id));

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json();
  const avatarKind = body.avatar_kind === 'preset' ? 'preset' : 'initials';
  let avatarPreset: string | null = null;

  if (avatarKind === 'preset') {
    const preset = typeof body.avatar_preset === 'string' ? body.avatar_preset.trim() : '';
    if (!preset || !PRESET_IDS.has(preset as never)) {
      return NextResponse.json({ error: 'Invalid avatar preset' }, { status: 400 });
    }
    avatarPreset = preset;
  }

  let avatarColor: string | null = null;
  if (typeof body.avatar_color === 'string' && body.avatar_color.trim()) {
    const color = body.avatar_color.trim().toLowerCase();
    if (!isValidAvatarColor(color)) {
      return NextResponse.json({ error: 'Invalid colour. Use a hex like #2966f2.' }, { status: 400 });
    }
    avatarColor = color;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      avatar_kind: avatarKind,
      avatar_preset: avatarPreset,
      avatar_color: avatarColor,
    })
    .eq('id', user.id);

  if (error) {
    // Column may not exist until migration is applied — retry without colour.
    if (error.message.toLowerCase().includes('avatar_color')) {
      const retry = await supabase
        .from('profiles')
        .update({
          avatar_kind: avatarKind,
          avatar_preset: avatarPreset,
        })
        .eq('id', user.id);
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        avatar_kind: avatarKind,
        avatar_preset: avatarPreset,
        avatar_color: null,
        warning: 'Colour saved locally only — run the avatar_color migration to persist it.',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    avatar_kind: avatarKind,
    avatar_preset: avatarPreset,
    avatar_color: avatarColor,
  });
}
