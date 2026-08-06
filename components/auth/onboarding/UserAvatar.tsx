'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { avatarPresetSrc, getInitials, type AvatarKind } from '@/lib/onboarding/constants';

type Props = {
  fullName: string;
  avatarKind: AvatarKind;
  avatarPreset?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({
  fullName,
  avatarKind,
  avatarPreset,
  size = 64,
  className,
}: Props) {
  const initials = getInitials(fullName || 'U');
  const src = avatarKind === 'preset' ? avatarPresetSrc(avatarPreset) : null;

  if (src) {
    return (
      <span
        className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full bg-primary/10', className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={`${fullName || 'User'} avatar`}
          width={size}
          height={size}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold select-none',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.34) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
