import type { UserRole } from '@/lib/navigation/types';

export type NavUser = {
  name: string;
  email: string;
  initials: string;
  role: UserRole;
};

type AuthUserLike = {
  email?: string | null;
  user_metadata?: { full_name?: string };
  profile?: {
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export function toNavUser(user: AuthUserLike): NavUser {
  const name =
    user.profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User';

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
  };
}
