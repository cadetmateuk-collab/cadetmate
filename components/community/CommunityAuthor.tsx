'use client';

import Link from 'next/link';
import { RoleNameBadge, UserAvatar } from '@/components/auth/onboarding/UserAvatar';
import { displayName } from '@/lib/community/utils';
import type { AuthorProfile } from '@/lib/community/types';
import { cn } from '@/lib/utils';

type Props = {
  userId: string;
  author?: AuthorProfile | null;
  size?: number;
  className?: string;
  /** Show display name beside the avatar */
  showName?: boolean;
};

export function CommunityAuthor({
  userId,
  author,
  size = 36,
  className,
  showName = true,
}: Props) {
  const name = displayName(author);
  const avatarKind = author?.avatar_kind === 'preset' ? 'preset' : 'initials';

  return (
    <Link
      href={`/community/user/${userId}`}
      className={cn(
        'inline-flex items-center gap-2 min-w-0 overflow-visible hover:opacity-90 transition-opacity',
        className,
      )}
    >
      <UserAvatar
        fullName={name}
        avatarKind={avatarKind}
        avatarPreset={author?.avatar_preset ?? null}
        avatarColor={author?.avatar_color ?? null}
        size={size}
        showRoleBadge={false}
      />
      {showName ? (
        <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
          <span className="truncate">{name}</span>
          <RoleNameBadge role={author?.role} />
        </span>
      ) : null}
    </Link>
  );
}
