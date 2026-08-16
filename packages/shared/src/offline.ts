export type ContentKind =
  | 'module'
  | 'flashcard_pack'
  | 'article'
  | 'survival'
  | 'quiz_bank'
  | 'trb';

export const CONTENT_KIND_LABEL: Record<ContentKind, string> = {
  module: 'Modules',
  flashcard_pack: 'Flashcard packs',
  article: 'Articles',
  survival: 'Sea survival',
  quiz_bank: 'Quizzes',
  trb: 'TRB',
};

/** Unsplash (and similar hotlinked CDNs) stay as remote URLs — do not pack them offline. */
export function isUnsplashUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'unsplash.com' || host.endsWith('.unsplash.com');
  } catch {
    return /unsplash/i.test(url);
  }
}

/** Only pack images that live on CadetMate / Supabase storage. */
export function shouldDownloadAsset(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  if (isUnsplashUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (host.includes('youtube') || host === 'youtu.be' || host.includes('vimeo')) return false;
    if (host.endsWith('.supabase.co') || host.endsWith('.supabase.in')) {
      return path.includes('/storage/v1/object/') || isImagePath(path);
    }
    if (host === 'cadetmate.co.uk' || host.endsWith('.cadetmate.co.uk')) return isImagePath(path);
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('ngrok')) return isImagePath(path);
    return false;
  } catch {
    return false;
  }
}

function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|svg|heic|bmp)(\?|$)/i.test(path) || path.includes('/images/');
}

export type InstalledContentRef = {
  kind: ContentKind;
  id: string;
  slug?: string;
  version: number;
};

export type CatalogItem = {
  kind: ContentKind;
  id: string;
  slug: string;
  title: string;
  version: number;
  bytes: number;
  bytesEstimated: boolean;
  isPremium: boolean;
  skippedVideo: boolean;
};

export type ContentUpdate = CatalogItem & {
  installedVersion: number | null;
};

export type ManifestFile = {
  path: string;
  sourceUrl: string;
  bytes: number;
  sha256: string | null;
};

export type ContentManifest = {
  kind: ContentKind;
  id: string;
  slug: string;
  title: string;
  version: number;
  bytes: number;
  bytesEstimated: boolean;
  isPremium: boolean;
  skippedVideo: boolean;
  files: ManifestFile[];
};

export type OfflineLicenceClaims = {
  sub: string;
  subscriptionId: string | null;
  entitlements: string[];
  iat: number;
  exp: number;
  jti: string;
};

export type SessionCheckRequest = {
  installed: InstalledContentRef[];
  pendingProgressRows?: number;
};

export type SessionCheckResponse = {
  checking: {
    account: boolean;
    licence: boolean;
    updates: boolean;
  };
  licence: {
    token: string;
    offlineUntil: string;
    entitlements: string[];
    subscriptionId: string | null;
  } | null;
  licenceDeniedReason: string | null;
  catalog: CatalogItem[];
  updates: ContentUpdate[];
  alreadyOnDevice: number;
  newCount: number;
  updateCount: number;
  totalDownloadBytes: number;
  sync: {
    estimatedUploadBytes: number;
    estimatedDownloadBytes: number;
  };
  lastConnectedAt: string;
};

export type ProgressSyncPayload = {
  modules: Array<{
    module_id: string;
    progress: number;
    completed: boolean;
    last_accessed: string | null;
    client_updated_at: string;
  }>;
  sections: Array<{
    module_id: string;
    section_index: number;
    completed_at: string;
  }>;
  activity: Array<{
    session_start: string;
    duration_seconds: number;
    page_path: string | null;
  }>;
  flashcards: Array<{
    card_id: string;
    pack_id: string;
    interval_days: number;
    repetitions: number;
    ease_factor: number;
    next_review: string;
    last_quality: number | null;
    times_viewed: number;
    times_correct: number;
    mastery: number;
    client_updated_at: string;
  }>;
  quizAnswers: Array<{
    question_id: string;
    selected_answer: string;
    correct: boolean;
    client_updated_at: string;
  }>;
};

export type ProgressSyncResponse = {
  applied: {
    modules: number;
    sections: number;
    activitySeconds: number;
    flashcards: number;
    quizAnswers: number;
  };
};
