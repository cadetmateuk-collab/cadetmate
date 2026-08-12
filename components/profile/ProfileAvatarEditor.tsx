'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { AvatarPicker } from '@/components/auth/onboarding/AvatarPicker';
import { UserAvatar } from '@/components/auth/onboarding/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  AVATAR_COLOR_SWATCHES,
  DEFAULT_AVATAR_COLOR,
  isValidAvatarColor,
  normalizeAvatarColor,
  type AvatarKind,
} from '@/lib/onboarding/constants';
import { cn } from '@/lib/utils';

type Props = {
  fullName: string;
  avatarKind: AvatarKind;
  avatarPreset: string | null;
  avatarColor: string | null;
  role: string | null;
};

export function ProfileAvatarEditor({
  fullName,
  avatarKind,
  avatarPreset,
  avatarColor,
  role,
}: Props) {
  const [kind, setKind] = useState<AvatarKind>(avatarKind);
  const [preset, setPreset] = useState<string | null>(avatarPreset);
  const [color, setColor] = useState(normalizeAvatarColor(avatarColor));
  const [savedKind, setSavedKind] = useState<AvatarKind>(avatarKind);
  const [savedPreset, setSavedPreset] = useState<string | null>(avatarPreset);
  const [savedColor, setSavedColor] = useState(normalizeAvatarColor(avatarColor));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setSavedKind(avatarKind);
    setSavedPreset(avatarPreset);
    setSavedColor(normalizeAvatarColor(avatarColor));
    setKind(avatarKind);
    setPreset(avatarPreset);
    setColor(normalizeAvatarColor(avatarColor));
  }, [avatarKind, avatarPreset, avatarColor]);

  const dirty =
    kind !== savedKind ||
    (kind === 'preset' ? preset : null) !== savedPreset ||
    color.toLowerCase() !== savedColor.toLowerCase();

  const setColorSafe = (value: string) => {
    const next = value.startsWith('#') ? value : `#${value}`;
    setColor(next.slice(0, 7).toLowerCase());
  };

  const save = async () => {
    setError(null);
    setMessage(null);
    if (!isValidAvatarColor(color)) {
      setError('Enter a valid hex colour like #2966f2.');
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_kind: kind,
          avatar_preset: kind === 'preset' ? preset : null,
          avatar_color: color.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update avatar');
      setSavedKind(kind);
      setSavedPreset(kind === 'preset' ? preset : null);
      setSavedColor(normalizeAvatarColor(data.avatar_color ?? color));
      setMessage(data.warning || 'Avatar saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update avatar');
    } finally {
      setPending(false);
    }
  };

  const reset = () => {
    setKind(savedKind);
    setPreset(savedPreset);
    setColor(savedColor);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-xs mb-1">Profile picture</p>
        <p className="text-xs text-muted-foreground mb-3">
          Choose initials or a preset, then pick any colour for the background.
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:w-28">
          <UserAvatar
            fullName={fullName}
            avatarKind={kind}
            avatarPreset={preset}
            avatarColor={color}
            size={64}
            role={role}
            badgeScale={0.25}
          />
          <span className="text-[11px] text-muted-foreground font-mono">{color}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Style
            </p>
            <AvatarPicker
              fullName={fullName}
              avatarKind={kind}
              avatarPreset={preset}
              size="sm"
              onChange={(nextKind, nextPreset) => {
                setKind(nextKind);
                setPreset(nextPreset);
              }}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Colour
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {AVATAR_COLOR_SWATCHES.map((swatch) => {
                const selected = color.toLowerCase() === swatch.toLowerCase();
                return (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Colour ${swatch}`}
                    aria-pressed={selected}
                    onClick={() => setColor(swatch)}
                    className={cn(
                      'relative h-8 w-8 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected && 'ring-2 ring-offset-2 ring-foreground',
                    )}
                    style={{ backgroundColor: swatch }}
                  >
                    {selected ? (
                      <Check
                        className="absolute inset-0 m-auto h-3.5 w-3.5"
                        style={{ color: swatch.toLowerCase() === '#eab308' ? '#242423' : '#fff' }}
                      />
                    ) : null}
                  </button>
                );
              })}
              <label className="relative inline-flex h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-dashed border-border shadow-sm">
                <span className="sr-only">Custom colour</span>
                <input
                  type="color"
                  value={isValidAvatarColor(color) ? color : DEFAULT_AVATAR_COLOR}
                  onChange={(e) => setColor(e.target.value.toLowerCase())}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="pointer-events-none block h-full w-full"
                  style={{
                    background:
                      'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                  }}
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="avatar-hex" className="text-xs text-muted-foreground">
                Hex
              </label>
              <input
                id="avatar-hex"
                type="text"
                value={color}
                onChange={(e) => setColorSafe(e.target.value)}
                spellCheck={false}
                className="h-9 w-[7.5rem] rounded-md border border-border bg-background px-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="#2966f2"
              />
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending || !dirty} onClick={() => void save()}>
          {pending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            'Save avatar'
          )}
        </Button>
        <Button type="button" variant="outline" disabled={pending || !dirty} onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
