/** Onboarding option lists and avatar presets for signup wizard. */

export type AvatarKind = 'initials' | 'preset';

export type OnboardingData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  avatarKind: AvatarKind;
  avatarPreset: string | null;
  trainingPhase: string;
  nauticalCollege: string;
  learningInterests: string[];
  referralSource: string;
  acceptedTerms: boolean;
};

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  avatarKind: 'initials',
  avatarPreset: null,
  trainingPhase: '',
  nauticalCollege: '',
  learningInterests: [],
  referralSource: '',
  acceptedTerms: false,
};

export const TRAINING_PHASES = [
  { id: 'phase_1', label: 'Phase 1' },
  { id: 'phase_2', label: 'Phase 2' },
  { id: 'phase_3', label: 'Phase 3' },
  { id: 'qualified_officer', label: 'Qualified Officer' },
  { id: 'other', label: 'Other' },
] as const;

export const NAUTICAL_COLLEGES = [
  'Warsash Maritime School (Solent University)',
  'South Shields Marine School',
  'Fleetwood Nautical Campus (Blackpool & The Fylde College)',
  'City of Glasgow College',
  'Plymouth University / MLA College',
  'Liverpool John Moores University',
  'Southampton Solent University',
  'University of Plymouth',
  'Lowestoft College',
  'North Atlantic Fisheries College (Shetland)',
  'Cork Institute of Technology / MTU',
  'National Maritime College of Ireland',
  'Other',
] as const;

export const LEARNING_INTERESTS = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'stability', label: 'Stability' },
  { id: 'colregs', label: 'COLREGS' },
  { id: 'meteorology', label: 'Meteorology' },
  { id: 'cargo_operations', label: 'Cargo Operations' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'oral_exam', label: 'Oral Exam Preparation' },
  { id: 'gmdss', label: 'GMDSS' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'safety', label: 'Safety' },
  { id: 'ship_construction', label: 'Ship Construction' },
  { id: 'other', label: 'Other' },
] as const;

export const REFERRAL_SOURCES = [
  { id: 'google', label: 'Google Search' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'friend', label: 'Friend' },
  { id: 'college', label: 'College' },
  { id: 'lecturer', label: 'Lecturer' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'other', label: 'Other' },
] as const;

/** Preset avatar ids — files live at /avatars/{id}.svg */
export const AVATAR_PRESETS = [
  { id: 'compass', label: 'Compass', src: '/avatars/compass.svg' },
  { id: 'helm', label: 'Helm', src: '/avatars/helm.svg' },
  { id: 'anchor', label: 'Anchor', src: '/avatars/anchor.svg' },
  { id: 'lighthouse', label: 'Lighthouse', src: '/avatars/lighthouse.svg' },
  { id: 'buoy', label: 'Buoy', src: '/avatars/buoy.svg' },
  { id: 'sextant', label: 'Sextant', src: '/avatars/sextant.svg' },
  { id: 'wave', label: 'Wave', src: '/avatars/wave.svg' },
  { id: 'star', label: 'Star', src: '/avatars/star.svg' },
] as const;

export function avatarPresetSrc(presetId: string | null | undefined): string | null {
  if (!presetId) return null;
  const found = AVATAR_PRESETS.find((p) => p.id === presetId);
  return found?.src ?? `/avatars/${presetId}.svg`;
}

/** Default CadetMate brand blue */
export const DEFAULT_AVATAR_COLOR = '#2966f2';

export const AVATAR_COLOR_SWATCHES = [
  '#2966f2',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#242423',
  '#64748b',
  '#78716c',
] as const;

export function isValidAvatarColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

export function normalizeAvatarColor(value: string | null | undefined): string {
  if (value && isValidAvatarColor(value)) return value.trim().toLowerCase();
  return DEFAULT_AVATAR_COLOR;
}

/** Pick white or near-black text for contrast on a hex background. */
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

export function labelForPhase(id: string): string {
  return TRAINING_PHASES.find((p) => p.id === id)?.label ?? id;
}

export function labelForReferral(id: string): string {
  return REFERRAL_SOURCES.find((r) => r.id === id)?.label ?? id;
}

export function labelsForInterests(ids: string[]): string[] {
  return ids.map((id) => LEARNING_INTERESTS.find((i) => i.id === id)?.label ?? id);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Loose phone check — optional field; empty is valid. */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');
  if (!cleaned) return true;
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

/** Wizard steps shown in the progress indicator (excludes verify). */
export const ONBOARDING_STEPS = [
  'welcome',
  'name',
  'email',
  'avatar',
  'password',
  'phone',
  'phase',
  'college',
  'interests',
  'referral',
  'review',
  'verify',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
