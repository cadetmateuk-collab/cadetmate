import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { isPremiumRole, isStaffRole } from '@cadet-mate/shared';
import type { CatalogItem, ContentKind, ContentManifest, InstalledContentRef, SessionCheckResponse } from '@cadet-mate/shared';
import { computeOfflineUntil, signOfflineLicence } from '@/lib/offline/licence';
import { buildManifest, contentVersionFromUpdatedAt, estimateCatalogItem } from '@/lib/offline/packages';

const PROGRESS_ROW_BYTES = 180;
const MODULE_BYTES_FALLBACK = 150_000;
const PACK_BYTES_FALLBACK = 200_000;
const ARTICLE_BYTES_FALLBACK = 80_000;
const SURVIVAL_BYTES_FALLBACK = 80_000;
const QUESTION_BYTES_FALLBACK = 800;
const TRB_TASK_BYTES_FALLBACK = 2_500;

type ProfileRow = {
  id: string;
  role: string | null;
  premium_status: string | null;
  stripe_subscription_id: string | null;
};

type PackagedContent = { manifest: ContentManifest; payload: unknown };

type VersionRow = {
  id: string;
  content_version?: number | null;
  updated_at?: string | null;
  date?: string | null;
};

export async function resolveUserEntitlement(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, premium_status, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  const row = profile as ProfileRow | null;
  const stripe = await readStripeSubscription(row?.stripe_subscription_id ?? null);
  const entitled =
    isStaffRole(row?.role) ||
    stripe.active ||
    (isPremiumRole(row?.role) && !row?.stripe_subscription_id && row?.premium_status === 'active');

  return {
    entitled,
    role: row?.role ?? null,
    stripe,
    entitlements: await buildEntitlements(userId, entitled),
  };
}

export async function runSessionCheck(opts: {
  userId: string;
  installed: InstalledContentRef[];
  pendingProgressRows: number;
}): Promise<SessionCheckResponse> {
  const entitlement = await resolveUserEntitlement(opts.userId);
  const { entitled, stripe } = entitlement;

  const offlineUntil = computeOfflineUntil({
    now: new Date(),
    stripePeriodEnd: stripe.periodEnd,
  });
  const signed = await signOfflineLicence({
    userId: opts.userId,
    subscriptionId: stripe.subscriptionId ?? null,
    entitlements: entitlement.entitlements,
    offlineUntil,
  });
  const licence: SessionCheckResponse['licence'] = {
    token: signed.token,
    offlineUntil: offlineUntil.toISOString(),
    entitlements: signed.claims.entitlements,
    subscriptionId: signed.claims.subscriptionId,
  };
  const licenceDeniedReason = entitled
    ? null
    : stripe.reason ?? 'Premium is not active. Modules, TRB and sea survival will not download.';

  const catalog = await listCatalog();
  const installedMap = new Map<string, number>();
  for (const item of opts.installed) {
    const version = toVersion(item.version);
    if (version == null) continue;
    installedMap.set(`${item.kind}:${item.id}`, version);
    if (item.slug) installedMap.set(`${item.kind}:${item.slug}`, version);
  }
  const entitlements = entitlement.entitlements;
  const allowed = catalog.filter((item) => userMayDownload(item.kind, item.id, entitled, entitlements));
  const updates = allowed
    .filter((item) => installedVersionOf(installedMap, item) !== item.version)
    .map((item) => ({
      ...item,
      installedVersion: installedVersionOf(installedMap, item),
    }));
  const newCount = updates.filter((item) => item.installedVersion == null).length;
  const updateCount = updates.length - newCount;

  return {
    checking: { account: true, licence: true, updates: true },
    licence,
    licenceDeniedReason,
    catalog,
    updates,
    alreadyOnDevice: allowed.length - updates.length,
    newCount,
    updateCount,
    totalDownloadBytes: updates.reduce((sum, item) => sum + item.bytes, 0),
    sync: {
      estimatedUploadBytes: Math.max(0, opts.pendingProgressRows) * PROGRESS_ROW_BYTES,
      estimatedDownloadBytes: 0,
    },
    lastConnectedAt: new Date().toISOString(),
  };
}

export function userMayDownload(
  kind: ContentKind,
  id: string,
  entitled: boolean,
  entitlements: string[],
): boolean {
  if (kind === 'article' || kind === 'quiz_bank') return true;
  if (kind === 'flashcard_pack') return entitlements.includes(`pack:${id}`);
  if (kind === 'module' || kind === 'survival' || kind === 'trb') return entitled;
  return false;
}

async function buildEntitlements(userId: string, entitled: boolean): Promise<string[]> {
  const entitlements: string[] = [];
  if (entitled) entitlements.push('premium');
  const { data: owned } = await supabaseAdmin
    .from('flashcard_pack_ownership')
    .select('pack_id')
    .eq('user_id', userId);
  for (const pack of owned ?? []) {
    if (pack.pack_id) entitlements.push(`pack:${pack.pack_id}`);
  }
  return entitlements;
}

async function readStripeSubscription(subscriptionId: string | null): Promise<{
  active: boolean;
  periodEnd: Date | null;
  subscriptionId: string | null;
  reason: string | null;
}> {
  if (!subscriptionId) {
    return { active: false, periodEnd: null, subscriptionId: null, reason: 'No Stripe subscription on file.' };
  }
  try {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId);
    const active = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due';
    const periodEndUnix =
      'current_period_end' in sub && typeof sub.current_period_end === 'number'
        ? sub.current_period_end
        : null;
    return {
      active,
      periodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
      subscriptionId: sub.id,
      reason: active ? null : `Stripe status is ${sub.status}.`,
    };
  } catch {
    return {
      active: false,
      periodEnd: null,
      subscriptionId,
      reason: 'Could not verify billing with Stripe.',
    };
  }
}

function toVersion(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function installedVersionOf(map: Map<string, number>, item: { kind: ContentKind; id: string; slug: string }): number | null {
  return map.get(`${item.kind}:${item.id}`) ?? map.get(`${item.kind}:${item.slug}`) ?? null;
}

function packageVersion(row: VersionRow) {
  const explicit = Number(row.content_version);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  return contentVersionFromUpdatedAt(row.updated_at ?? row.date, row.id);
}

function latestVersion(rows: { updated_at?: string | null; created_at?: string | null }[], id: string) {
  return contentVersionFromUpdatedAt(
    (rows ?? []).reduce((latest: string | null, row) => {
      const stamp = row.updated_at ?? row.created_at ?? null;
      if (!latest) return stamp;
      if (!stamp) return latest;
      return stamp > latest ? stamp : latest;
    }, null),
    id,
  );
}

/** Fast catalog for session-check: versions and size estimates only. No HEAD, no storage downloads. */
async function listCatalog(): Promise<CatalogItem[]> {
  const [modulesRes, packsRes, postsRes, survivalRes, questionsRes, trbRes] = await Promise.all([
    supabaseAdmin
      .from('modules')
      .select('id, slug, title, is_premium, content_version, updated_at, image_url')
      .or('hidden.eq.false,hidden.is.null'),
    supabaseAdmin
      .from('flashcard_packs')
      .select('id, slug, title, is_premium, content_version, updated_at, thumbnail_url')
      .eq('status', 'published'),
    supabaseAdmin
      .from('blog_posts')
      .select('id, slug, title, content_version, updated_at, date, image')
      .or('hidden.eq.false,hidden.is.null'),
    supabaseAdmin.from('sea_survival').select('id, slug, title, content_version, updated_at, image'),
    supabaseAdmin.from('daily_questions').select('id, created_at, question_date'),
    supabaseAdmin.from('trb_tasks').select('id, updated_at, image_urls'),
  ]);

  const catalogError =
    modulesRes.error ?? packsRes.error ?? postsRes.error ?? survivalRes.error ?? questionsRes.error ?? trbRes.error;
  if (catalogError) throw catalogError;

  const catalog: CatalogItem[] = [];

  for (const row of modulesRes.data ?? []) {
    catalog.push(
      estimateCatalogItem({
        kind: 'module',
        id: row.id,
        slug: row.slug ?? row.id,
        title: row.title ?? 'Module',
        isPremium: Boolean(row.is_premium),
        version: packageVersion(row),
        extraUrls: row.image_url ? [row.image_url] : [],
        extraBytes: MODULE_BYTES_FALLBACK,
      }),
    );
  }

  for (const row of packsRes.data ?? []) {
    catalog.push(
      estimateCatalogItem({
        kind: 'flashcard_pack',
        id: row.id,
        slug: row.slug ?? row.id,
        title: row.title ?? 'Flashcards',
        isPremium: Boolean(row.is_premium),
        version: packageVersion(row),
        extraUrls: row.thumbnail_url ? [row.thumbnail_url] : [],
        extraBytes: PACK_BYTES_FALLBACK,
      }),
    );
  }

  for (const row of postsRes.data ?? []) {
    catalog.push(
      estimateCatalogItem({
        kind: 'article',
        id: row.id,
        slug: row.slug ?? row.id,
        title: row.title ?? 'Article',
        isPremium: false,
        version: packageVersion(row),
        extraUrls: row.image ? [row.image] : [],
        extraBytes: ARTICLE_BYTES_FALLBACK,
      }),
    );
  }

  for (const row of survivalRes.data ?? []) {
    catalog.push(
      estimateCatalogItem({
        kind: 'survival',
        id: row.id,
        slug: row.slug ?? row.id,
        title: row.title ?? 'Sea survival',
        isPremium: true,
        version: packageVersion(row),
        extraUrls: row.image ? [row.image] : [],
        extraBytes: SURVIVAL_BYTES_FALLBACK,
      }),
    );
  }

  const questions = questionsRes.data ?? [];
  catalog.push(
    estimateCatalogItem({
      kind: 'quiz_bank',
      id: 'daily_questions',
      slug: 'daily-questions',
      title: 'Daily quiz & orals',
      isPremium: false,
      version: latestVersion(
        questions.map((row) => ({ created_at: row.created_at ?? row.question_date })),
        'daily_questions',
      ),
      extraBytes: Math.max(5_000, questions.length * QUESTION_BYTES_FALLBACK),
    }),
  );

  const trbTasks = trbRes.data ?? [];
  const trbUrls: string[] = [];
  for (const row of trbTasks) {
    const raw = row.image_urls;
    if (Array.isArray(raw)) {
      for (const url of raw) {
        if (typeof url === 'string' && url) trbUrls.push(url);
      }
    }
  }
  catalog.push(
    estimateCatalogItem({
      kind: 'trb',
      id: 'trb_tasks',
      slug: 'trb',
      title: 'TRB tasks',
      isPremium: true,
      version: latestVersion(trbTasks, 'trb_tasks'),
      extraUrls: trbUrls,
      extraBytes: Math.max(8_000, trbTasks.length * TRB_TASK_BYTES_FALLBACK),
    }),
  );

  return catalog;
}

async function findByIdOrSlug(table: 'modules' | 'flashcard_packs' | 'blog_posts' | 'sea_survival', id: string) {
  const { data: byId } = await supabaseAdmin.from(table).select('*').eq('id', id).maybeSingle();
  if (byId) return byId;
  const { data: bySlug } = await supabaseAdmin.from(table).select('*').eq('slug', id).maybeSingle();
  return bySlug;
}

async function loadFlashcardPayload(row: Record<string, unknown>) {
  let payload: Record<string, unknown> = { pack: row, cards: [] as unknown[] };
  const storagePath = typeof row.storage_path === 'string' ? row.storage_path : null;
  if (storagePath) {
    const { data: file } = await supabaseAdmin.storage.from('flashcards').download(storagePath);
    if (file) {
      try {
        payload = JSON.parse(await file.text()) as Record<string, unknown>;
        payload.pack = row;
      } catch {
        payload = { pack: row, cards: [] };
      }
    }
  } else {
    const { data: cards } = await supabaseAdmin.from('flashcards').select('*').eq('pack_id', row.id).order('position');
    payload = { pack: row, cards: cards ?? [] };
  }
  return payload;
}

async function packageContent(opts: Parameters<typeof buildManifest>[0]): Promise<PackagedContent> {
  return { manifest: await buildManifest(opts), payload: opts.payload };
}

export async function getContentPackage(kind: ContentKind, id: string): Promise<PackagedContent | null> {
  if (kind === 'module') {
    const row = await findByIdOrSlug('modules', id);
    if (!row) return null;
    return packageContent({
      kind: 'module',
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title ?? 'Module',
      isPremium: Boolean(row.is_premium),
      version: packageVersion(row),
      payload: row,
      extraUrls: row.image_url ? [row.image_url] : [],
    });
  }

  if (kind === 'flashcard_pack') {
    const row = await findByIdOrSlug('flashcard_packs', id);
    if (!row) return null;
    const payload = await loadFlashcardPayload(row as Record<string, unknown>);
    return packageContent({
      kind: 'flashcard_pack',
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title ?? 'Flashcards',
      isPremium: Boolean(row.is_premium),
      version: packageVersion(row),
      payload,
      extraUrls: row.thumbnail_url ? [row.thumbnail_url] : [],
    });
  }

  if (kind === 'article') {
    const row = await findByIdOrSlug('blog_posts', id);
    if (!row) return null;
    return packageContent({
      kind: 'article',
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title ?? 'Article',
      isPremium: false,
      version: packageVersion(row),
      payload: row,
      extraUrls: row.image ? [row.image] : [],
    });
  }

  if (kind === 'survival') {
    const row = await findByIdOrSlug('sea_survival', id);
    if (!row) return null;
    return packageContent({
      kind: 'survival',
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title ?? 'Sea survival',
      isPremium: true,
      version: packageVersion(row),
      payload: row,
      extraUrls: row.image ? [row.image] : [],
    });
  }

  if (kind === 'quiz_bank' && (id === 'daily_questions' || id === 'daily-questions')) {
    const { data: questions } = await supabaseAdmin.from('daily_questions').select('*').order('created_at');
    return packageContent({
      kind: 'quiz_bank',
      id: 'daily_questions',
      slug: 'daily-questions',
      title: 'Daily quiz & orals',
      isPremium: false,
      version: latestVersion(questions ?? [], 'daily_questions'),
      payload: { questions: questions ?? [] },
    });
  }

  if (kind === 'trb' && (id === 'trb_tasks' || id === 'trb')) {
    const { data: trbTasks } = await supabaseAdmin.from('trb_tasks').select('*').order('code');
    const trbUrls: string[] = [];
    for (const row of trbTasks ?? []) {
      const raw = row.image_urls;
      if (Array.isArray(raw)) {
        for (const url of raw) {
          if (typeof url === 'string' && url) trbUrls.push(url);
        }
      }
    }
    return packageContent({
      kind: 'trb',
      id: 'trb_tasks',
      slug: 'trb',
      title: 'TRB tasks',
      isPremium: true,
      version: latestVersion(trbTasks ?? [], 'trb_tasks'),
      payload: { tasks: trbTasks ?? [] },
      extraUrls: trbUrls,
    });
  }

  return null;
}

export function etagForPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}
