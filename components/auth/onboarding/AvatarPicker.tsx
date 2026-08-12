'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVATAR_PRESETS, getInitials, type AvatarKind } from '@/lib/onboarding/constants';
import { MOTION } from '@/lib/motion/constants';
import Image from 'next/image';

type Props = {
  fullName: string;
  avatarKind: AvatarKind;
  avatarPreset: string | null;
  onChange: (kind: AvatarKind, preset: string | null) => void;
  /** `md` for onboarding; `sm` for profile settings */
  size?: 'sm' | 'md';
};

const SIZE = {
  sm: {
    grid: 'grid grid-cols-3 gap-2 max-w-[13rem]',
    tile: 'h-11 w-11',
    img: 44,
    initials: 'text-xs',
    check: 'h-4 w-4 -bottom-0.5 -right-0.5',
    checkIcon: 'h-2.5 w-2.5',
  },
  md: {
    grid: 'grid grid-cols-3 gap-3 max-w-[17rem] h-full content-center',
    tile: 'h-[4.25rem] w-[4.25rem]',
    img: 64,
    initials: 'text-sm',
    check: 'h-5 w-5 -bottom-0.5 -right-0.5',
    checkIcon: 'h-3 w-3',
  },
} as const;

/** 3×3 grid: initials + 8 presets */
export function AvatarPicker({
  fullName,
  avatarKind,
  avatarPreset,
  onChange,
  size = 'md',
}: Props) {
  const initials = getInitials(fullName || 'You');
  const s = SIZE[size];

  return (
    <div className={cn(s.grid, 'place-items-center mx-auto sm:mx-0')}>
      <AvatarTile
        selected={avatarKind === 'initials'}
        label="Use initials"
        tileClass={s.tile}
        checkClass={s.check}
        checkIconClass={s.checkIcon}
        onSelect={() => onChange('initials', null)}
      >
        <span
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground font-bold',
            s.initials,
          )}
        >
          {initials}
        </span>
      </AvatarTile>

      {AVATAR_PRESETS.map((preset) => (
        <AvatarTile
          key={preset.id}
          selected={avatarKind === 'preset' && avatarPreset === preset.id}
          label={preset.label}
          tileClass={s.tile}
          checkClass={s.check}
          checkIconClass={s.checkIcon}
          onSelect={() => onChange('preset', preset.id)}
        >
          <Image
            src={preset.src}
            alt={preset.label}
            width={s.img}
            height={s.img}
            className="h-full w-full object-cover rounded-full"
          />
        </AvatarTile>
      ))}
    </div>
  );
}

function AvatarTile({
  selected,
  label,
  onSelect,
  children,
  tileClass,
  checkClass,
  checkIconClass,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  children: React.ReactNode;
  tileClass: string;
  checkClass: string;
  checkIconClass: string;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease }}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        'relative rounded-full p-0.5 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        tileClass,
        selected ? 'ring-[3px] ring-primary shadow-md' : 'ring-2 ring-transparent hover:ring-border',
      )}
    >
      <span className="block h-full w-full overflow-hidden rounded-full">{children}</span>
      {selected && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow',
            checkClass,
          )}
        >
          <Check className={checkIconClass} aria-hidden />
        </span>
      )}
    </motion.button>
  );
}
