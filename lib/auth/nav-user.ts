import type { UserRole } from '@/lib/navigation/types';
import type { AvatarKind } from '@/lib/onboarding/constants';

export type NavUser = {
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  avatarKind: AvatarKind;
  avatarPreset: string | null;
};

type AuthUserLike = {
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_kind?: string;
    avatar_preset?: string | null;
  };
  profile?: {
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
    avatar_kind?: string | null;
    avatar_preset?: string | null;
  } | null;
};

export function toNavUser(user: AuthUserLike): NavUser {
  const name =
    user.profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User';

  const kindRaw = user.profile?.avatar_kind || user.user_metadata?.avatar_kind;
  const avatarKind: AvatarKind = kindRaw === 'preset' ? 'preset' : 'initials';
  const avatarPreset =
    avatarKind === 'preset'
      ? (user.profile?.avatar_preset ?? user.user_metadata?.avatar_preset ?? null)
      : null;

  return {
    name,
    email: user.profile?.email || user.email || '',
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    role: (user.profile?.role as UserRole) || 'free',
    avatarKind,
    avatarPreset,
  };
}
