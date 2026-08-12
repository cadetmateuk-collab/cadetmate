import type { ModerationResult } from './types';
import {
  BLOCKED_PHRASES,
  BLOCKED_TOKENS,
  FLAGGED_PHRASES,
  normalizeForModeration,
  tokenize,
  type ProfanityCategory,
} from './profanity-list';

const FLAG_CATEGORIES = [
  'hate',
  'harassment',
  'violence',
  'sexual',
  'self-harm',
  'spam',
  'toxicity',
] as const;

const SPAM_PATTERNS = [
  /(?:https?:\/\/){3,}/i,
  /(.)\1{10,}/,
];

function mapCategory(cat: ProfanityCategory): string {
  switch (cat) {
    case 'threat':
      return 'violence';
    case 'slur':
      return 'hate';
    case 'self-harm':
      return 'self-harm';
    case 'sexual':
      return 'sexual';
    case 'spam':
      return 'spam';
    default:
      return 'toxicity';
  }
}

/** Always-on static list moderation (runs before / alongside OpenAI). */
export function staticListModeration(text: string): ModerationResult {
  const normalized = normalizeForModeration(text);
  const tokens = new Set(tokenize(normalized));
  const blocked: string[] = [];
  const flagged: string[] = [];

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) blocked.push('spam');
  }

  for (const { word, category } of BLOCKED_TOKENS) {
    if (tokens.has(word)) blocked.push(mapCategory(category));
  }

  for (const { phrase, category } of BLOCKED_PHRASES) {
    if (normalized.includes(normalizeForModeration(phrase))) {
      blocked.push(mapCategory(category));
    }
  }

  for (const { phrase, category } of FLAGGED_PHRASES) {
    if (normalized.includes(normalizeForModeration(phrase))) {
      flagged.push(mapCategory(category));
    }
  }

  if (blocked.length > 0) {
    return {
      action: 'blocked',
      explanation:
        'Your content was blocked by our community text filter. Please remove offensive, threatening, or spam language and try again.',
      categories: [...new Set(blocked)],
      toxicityScore: 0.95,
      provider: 'static-list',
    };
  }

  if (flagged.length > 0) {
    return {
      action: 'flagged',
      explanation:
        'Your content was flagged and held for admin review. It will not appear publicly until an admin approves it.',
      categories: [...new Set(flagged)],
      toxicityScore: 0.55,
      provider: 'static-list',
    };
  }

  return {
    action: 'approved',
    explanation: 'Content approved.',
    categories: [],
    toxicityScore: 0,
    provider: 'static-list',
  };
}

async function openaiModeration(text: string): Promise<ModerationResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: Array<{
        flagged?: boolean;
        categories?: Record<string, boolean>;
        category_scores?: Record<string, number>;
      }>;
    };
    const result = data.results?.[0];
    if (!result) return null;

    const categories: string[] = [];
    const scores: number[] = [];

    for (const cat of FLAG_CATEGORIES) {
      if (result.categories?.[cat]) categories.push(cat);
      if (typeof result.category_scores?.[cat] === 'number') {
        scores.push(result.category_scores[cat]);
      }
    }

    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    if (result.flagged || maxScore >= 0.85) {
      return {
        action: 'blocked',
        explanation:
          'Your content violates our community guidelines and cannot be published. Please remove harmful, harassing, or inappropriate language.',
        categories,
        toxicityScore: maxScore,
        provider: 'openai',
        raw: result,
      };
    }

    if (maxScore >= 0.5) {
      return {
        action: 'flagged',
        explanation:
          'Your content was flagged and held for admin review. It will not appear publicly until an admin approves it.',
        categories,
        toxicityScore: maxScore,
        provider: 'openai',
        raw: result,
      };
    }

    return {
      action: 'approved',
      explanation: 'Content approved.',
      categories: [],
      toxicityScore: maxScore,
      provider: 'openai',
      raw: result,
    };
  } catch {
    return null;
  }
}

/**
 * Moderate community text.
 * 1) Always run the editable static list (blocks / soft-flags).
 * 2) If OpenAI is configured, also run model moderation and take the stricter action.
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const local = staticListModeration(text);
  if (local.action === 'blocked') return local;

  const openai = await openaiModeration(text);
  if (!openai) return local;

  if (openai.action === 'blocked') return openai;
  if (openai.action === 'flagged' || local.action === 'flagged') {
    return {
      action: 'flagged',
      explanation: openai.action === 'flagged' ? openai.explanation : local.explanation,
      categories: [...new Set([...openai.categories, ...local.categories])],
      toxicityScore: Math.max(openai.toxicityScore ?? 0, local.toxicityScore ?? 0),
      provider: openai.provider === 'openai' ? 'openai+static-list' : local.provider,
      raw: openai.raw,
    };
  }

  return openai;
}
