import type { ModerationResult } from './types';

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
  /(?:buy now|click here|free money|crypto giveaway)/i,
  /(.)\1{10,}/,
];

function basicModeration(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const flagged: string[] = [];

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) flagged.push('spam');
  }

  const toxicWords = ['kill yourself', 'kys', 'nazi', 'rape'];
  for (const word of toxicWords) {
    if (lower.includes(word)) flagged.push('toxicity');
  }

  if (flagged.length > 0) {
    return {
      action: 'blocked',
      explanation: 'Your content was flagged by our automated moderation system. Please revise and try again.',
      categories: [...new Set(flagged)],
      toxicityScore: 0.9,
      provider: 'basic',
    };
  }

  return {
    action: 'approved',
    explanation: 'Content approved.',
    categories: [],
    toxicityScore: 0,
    provider: 'basic',
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

    const data = await res.json();
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
        explanation: 'Your content has been published but flagged for moderator review.',
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

export async function moderateContent(text: string): Promise<ModerationResult> {
  const openai = await openaiModeration(text);
  if (openai) return openai;
  return basicModeration(text);
}
