/** Same preset IDs and colours as the website (`lib/onboarding/constants.ts`). */

export type AvatarKind = 'initials' | 'preset';

export const DEFAULT_AVATAR_COLOR = '#2966f2';

const AVATAR_PRESET_IDS = [
  'compass',
  'helm',
  'anchor',
  'lighthouse',
  'buoy',
  'sextant',
  'wave',
  'star',
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

/** Bundled copies of `public/avatars/{id}.svg` so Expo Go does not need the website. */
export const AVATAR_PRESET_SVG: Record<AvatarPresetId, string> = {
  compass: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#2966F2"/><circle cx="128" cy="128" r="72" fill="none" stroke="#fff" stroke-width="8"/><circle cx="128" cy="128" r="10" fill="#F4C95F"/><path d="M128 56 L140 128 L128 112 L116 128 Z" fill="#fff"/><path d="M128 200 L116 128 L128 144 L140 128 Z" fill="#F4C95F"/><path d="M56 128 L128 116 L112 128 L128 140 Z" fill="#fff" opacity=".85"/><path d="M200 128 L128 140 L144 128 L128 116 Z" fill="#fff" opacity=".85"/></svg>`,
  helm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#1B4DB8"/><circle cx="128" cy="128" r="54" fill="none" stroke="#F4C95F" stroke-width="10"/><circle cx="128" cy="128" r="18" fill="#F4C95F"/><g stroke="#fff" stroke-width="12" stroke-linecap="round"><line x1="128" y1="40" x2="128" y2="74"/><line x1="128" y1="182" x2="128" y2="216"/><line x1="40" y1="128" x2="74" y2="128"/><line x1="182" y1="128" x2="216" y2="128"/><line x1="66" y1="66" x2="90" y2="90"/><line x1="166" y1="166" x2="190" y2="190"/><line x1="190" y1="66" x2="166" y2="90"/><line x1="90" y1="166" x2="66" y2="190"/></g></svg>`,
  anchor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#0E3A7A"/><circle cx="128" cy="70" r="18" fill="none" stroke="#F4C95F" stroke-width="8"/><path d="M128 88 V190" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M88 120 H168" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M70 160 Q70 200 128 210 Q186 200 186 160" fill="none" stroke="#F4C95F" stroke-width="12" stroke-linecap="round"/></svg>`,
  lighthouse: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#2456C9"/><path d="M108 70 H148 L158 190 H98 Z" fill="#fff"/><rect x="108" y="100" width="40" height="16" fill="#2966F2"/><rect x="108" y="140" width="40" height="16" fill="#2966F2"/><rect x="104" y="58" width="48" height="18" rx="3" fill="#F4C95F"/><path d="M128 40 L148 58 H108 Z" fill="#fff"/><ellipse cx="128" cy="200" rx="56" ry="10" fill="#1B3F8A" opacity=".5"/></svg>`,
  buoy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#1E5AD6"/><rect x="118" y="48" width="20" height="40" rx="4" fill="#fff"/><circle cx="128" cy="130" r="52" fill="#E03A3A"/><rect x="76" y="112" width="104" height="36" fill="#fff"/><circle cx="128" cy="130" r="16" fill="#1E5AD6"/><path d="M60 190 Q128 170 196 190" fill="none" stroke="#F4C95F" stroke-width="8" stroke-linecap="round"/></svg>`,
  sextant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#163A8C"/><path d="M70 170 A80 80 0 0 1 186 170" fill="none" stroke="#F4C95F" stroke-width="12" stroke-linecap="round"/><line x1="128" y1="70" x2="128" y2="170" stroke="#fff" stroke-width="8" stroke-linecap="round"/><line x1="128" y1="70" x2="178" y2="150" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="128" cy="70" r="10" fill="#F4C95F"/><circle cx="178" cy="150" r="8" fill="#fff"/></svg>`,
  wave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#2A7DE1"/><path d="M40 120 Q70 90 100 120 T160 120 T220 120" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M40 156 Q70 126 100 156 T160 156 T220 156" fill="none" stroke="#F4C95F" stroke-width="12" stroke-linecap="round"/><path d="M40 190 Q70 160 100 190 T160 190 T220 190" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#0F2F6B"/><path d="M128 52 L144 108 L202 108 L156 142 L172 198 L128 166 L84 198 L100 142 L54 108 L112 108 Z" fill="#F4C95F"/><circle cx="70" cy="70" r="5" fill="#fff" opacity=".8"/><circle cx="190" cy="78" r="4" fill="#fff" opacity=".7"/><circle cx="198" cy="170" r="3" fill="#fff" opacity=".6"/></svg>`,
};

export function isAvatarPresetId(value: string | null | undefined): value is AvatarPresetId {
  return Boolean(value && AVATAR_PRESET_IDS.includes(value as AvatarPresetId));
}

export function avatarPresetXml(presetId: string | null | undefined): string | null {
  if (!isAvatarPresetId(presetId)) return null;
  return AVATAR_PRESET_SVG[presetId];
}

export function normalizeAvatarKind(value: string | null | undefined): AvatarKind {
  return value === 'preset' ? 'preset' : 'initials';
}

export function isValidAvatarColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

export function normalizeAvatarColor(value: string | null | undefined): string {
  if (value && isValidAvatarColor(value)) return value.trim().toLowerCase();
  return DEFAULT_AVATAR_COLOR;
}

export function contrastTextOn(hex: string): '#ffffff' | '#242423' {
  const raw = normalizeAvatarColor(hex).slice(1);
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return L > 0.55 ? '#242423' : '#ffffff';
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
