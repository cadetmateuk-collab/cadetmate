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
};

/** 3×3 grid: initials + 8 presets — sized to fit the fixed onboarding panel without scrolling. */
export function AvatarPicker({ fullName, avatarKind, avatarPreset, onChange }: Props) {
  const initials = getInitials(fullName || 'You');

  return (
    <div className="grid grid-cols-3 gap-3 place-items-center content-center h-full max-w-[17rem] mx-auto">
      <AvatarTile
        selected={avatarKind === 'initials'}
        label="Use initials"
        onSelect={() => onChange('initials', null)}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {initials}
        </span>
      </AvatarTile>

      {AVATAR_PRESETS.map((preset) => (
        <AvatarTile
          key={preset.id}
          selected={avatarKind === 'preset' && avatarPreset === preset.id}
          label={preset.label}
          onSelect={() => onChange('preset', preset.id)}
        >
          <Image
            src={preset.src}
            alt={preset.label}
            width={64}
            height={64}
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
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  children: React.ReactNode;
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
        'relative h-[4.25rem] w-[4.25rem] rounded-full p-0.5 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected ? 'ring-[3px] ring-primary shadow-md' : 'ring-2 ring-transparent hover:ring-border',
      )}
    >
      <span className="block h-full w-full overflow-hidden rounded-full">{children}</span>
      {selected && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      )}
    </motion.button>
  );
}
