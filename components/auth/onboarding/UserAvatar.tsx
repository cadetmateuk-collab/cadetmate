'use client';

import Image from 'next/image';
import { Crown, Shield, Ship, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  avatarPresetSrc,
  contrastTextOn,
  getInitials,
  normalizeAvatarColor,
  type AvatarKind,
} from '@/lib/onboarding/constants';

type Props = {
  fullName: string;
  avatarKind: AvatarKind;
  avatarPreset?: string | null;
  avatarColor?: string | null;
  size?: number;
  className?: string;
  /** When set with showRoleBadge, shows a role badge on the avatar (free = none). */
  role?: string | null;
  /** Overlay badge on the avatar. Default true when role is set. */
  showRoleBadge?: boolean;
  /** Badge diameter as a fraction of avatar size. Default 0.25. */
  badgeScale?: number;
};

export function roleBadgeMeta(role: string | null | undefined): {
  Icon: LucideIcon;
  label: string;
} | null {
  if (role === 'admin') return { Icon: Shield, label: 'Admin' };
  if (role === 'content') return { Icon: Ship, label: 'Content' };
  if (role === 'premium') return { Icon: Crown, label: 'Premium' };
  return null;
}

/** Inline role icon sized to surrounding text (1em of parent font-size). */
export function RoleNameBadge({
  role,
  className,
}: {
  role?: string | null;
  className?: string;
}) {
  const meta = roleBadgeMeta(role);
  if (!meta) return null;
  const { Icon, label } = meta;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-primary align-middle',
        className,
      )}
      style={{ fontSize: '1em', lineHeight: 1 }}
      title={label}
      aria-label={label}
    >
      <Icon
        size="1em"
        strokeWidth={2.4}
        className="block shrink-0"
        aria-hidden
      />
    </span>
  );
}

function AvatarRoleBadge({ role, size, scale }: { role: string; size: number; scale: number }) {
  const meta = roleBadgeMeta(role);
  if (!meta) return null;

  const badgeSize = Math.max(1, Math.round(size * scale));
  const iconSize = Math.max(1, Math.round(badgeSize * 0.55));
  const ringWidth = Math.max(1, Math.round(badgeSize * 0.1));
  const offset = Math.round(badgeSize * 0.12);
  const { Icon, label } = meta;

  return (
    <span
      className="pointer-events-none absolute z-20 rounded-full bg-primary text-primary-foreground shadow-md"
      style={{
        width: badgeSize,
        height: badgeSize,
        right: -offset,
        bottom: -offset,
        boxShadow: `0 0 0 ${ringWidth}px #fff, 0 1px 3px rgba(0,0,0,0.18)`,
      }}
      title={label}
      aria-label={label}
    >
      <span className="absolute inset-0 flex items-center justify-center leading-none">
        <Icon
          className="block shrink-0"
          width={iconSize}
          height={iconSize}
          strokeWidth={2.4}
          aria-hidden
        />
      </span>
    </span>
  );
}

export function UserAvatar({
  fullName,
  avatarKind,
  avatarPreset,
  avatarColor,
  size = 64,
  className,
  role,
  showRoleBadge = true,
  badgeScale = 0.25,
}: Props) {
  const initials = getInitials(fullName || 'U');
  const src = avatarKind === 'preset' ? avatarPresetSrc(avatarPreset) : null;
  const color = normalizeAvatarColor(avatarColor);
  const fg = contrastTextOn(color);
  const showBadge = showRoleBadge && Boolean(roleBadgeMeta(role));

  return (
    <span
      className={cn('relative inline-flex shrink-0 overflow-visible', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <span
          className="relative inline-flex size-full overflow-hidden rounded-full"
          style={{ width: size, height: size, backgroundColor: color }}
        >
          <Image
            src={src}
            alt={`${fullName || 'User'} avatar`}
            width={size}
            height={size}
            className="object-cover"
          />
        </span>
      ) : (
        <span
          className="inline-flex size-full items-center justify-center overflow-hidden rounded-full font-semibold select-none"
          style={{
            width: size,
            height: size,
            fontSize: Math.max(12, size * 0.34),
            backgroundColor: color,
            color: fg,
          }}
          aria-hidden
        >
          {initials}
        </span>
      )}
      {showBadge && role ? (
        <AvatarRoleBadge role={role} size={size} scale={badgeScale} />
      ) : null}
    </span>
  );
}
