/**
 * Static text-moderation word/phrase list for community posts & comments.
 * Edit this list to tighten or loosen filtering. Matching is case-insensitive
 * and uses word-boundary-ish checks for single tokens; phrases match as substrings.
 *
 * Categories map to moderation reasons shown in logs / user feedback.
 */

export type ProfanityCategory =
  | 'profanity'
  | 'slur'
  | 'threat'
  | 'sexual'
  | 'spam'
  | 'self-harm';

/** Exact token matches (normalized: lowercased, punctuation stripped). */
export const BLOCKED_TOKENS: ReadonlyArray<{ word: string; category: ProfanityCategory }> = [
  // Profanity / abuse
  { word: 'fuck', category: 'profanity' },
  { word: 'fucker', category: 'profanity' },
  { word: 'fucking', category: 'profanity' },
  { word: 'motherfucker', category: 'profanity' },
  { word: 'shit', category: 'profanity' },
  { word: 'bullshit', category: 'profanity' },
  { word: 'asshole', category: 'profanity' },
  { word: 'bastard', category: 'profanity' },
  { word: 'bitch', category: 'profanity' },
  { word: 'cunt', category: 'profanity' },
  { word: 'dickhead', category: 'profanity' },
  { word: 'twat', category: 'profanity' },
  { word: 'wanker', category: 'profanity' },
  { word: 'bollocks', category: 'profanity' },
  { word: 'piss', category: 'profanity' },
  { word: 'crap', category: 'profanity' },
  { word: 'damn', category: 'profanity' },
  { word: 'goddamn', category: 'profanity' },
  { word: 'slut', category: 'profanity' },
  { word: 'whore', category: 'profanity' },
  { word: 'retard', category: 'slur' },
  { word: 'retarded', category: 'slur' },
  // Slurs (kept minimal but explicit for blocking)
  { word: 'nigger', category: 'slur' },
  { word: 'nigga', category: 'slur' },
  { word: 'faggot', category: 'slur' },
  { word: 'fag', category: 'slur' },
  { word: 'tranny', category: 'slur' },
  { word: 'chink', category: 'slur' },
  { word: 'spic', category: 'slur' },
  { word: 'kike', category: 'slur' },
  { word: 'paki', category: 'slur' },
  // Sexual
  { word: 'porn', category: 'sexual' },
  { word: 'porno', category: 'sexual' },
  { word: 'onlyfans', category: 'sexual' },
  { word: 'hentai', category: 'sexual' },
  { word: 'nude', category: 'sexual' },
  { word: 'nudes', category: 'sexual' },
  { word: 'cock', category: 'sexual' },
  { word: 'dick', category: 'sexual' },
  { word: 'pussy', category: 'sexual' },
  { word: 'boobs', category: 'sexual' },
  { word: 'blowjob', category: 'sexual' },
  { word: 'handjob', category: 'sexual' },
  // Threats / violence
  { word: 'kys', category: 'threat' },
  // Self-harm
  { word: 'suicide', category: 'self-harm' },
];

/** Multi-word / phrase matches (substring on normalized text). */
export const BLOCKED_PHRASES: ReadonlyArray<{ phrase: string; category: ProfanityCategory }> = [
  { phrase: 'kill yourself', category: 'threat' },
  { phrase: 'kill yourselves', category: 'threat' },
  { phrase: 'kill himself', category: 'threat' },
  { phrase: 'kill herself', category: 'threat' },
  { phrase: 'kill them', category: 'threat' },
  { phrase: 'i will kill', category: 'threat' },
  { phrase: 'im going to kill', category: 'threat' },
  { phrase: "i'm going to kill", category: 'threat' },
  { phrase: 'rape you', category: 'threat' },
  { phrase: 'rape her', category: 'threat' },
  { phrase: 'rape him', category: 'threat' },
  { phrase: 'go die', category: 'threat' },
  { phrase: 'hope you die', category: 'threat' },
  { phrase: 'end your life', category: 'self-harm' },
  { phrase: 'cut yourself', category: 'self-harm' },
  { phrase: 'hang yourself', category: 'self-harm' },
  { phrase: 'buy now', category: 'spam' },
  { phrase: 'click here', category: 'spam' },
  { phrase: 'free money', category: 'spam' },
  { phrase: 'crypto giveaway', category: 'spam' },
  { phrase: 'make money fast', category: 'spam' },
  { phrase: 'work from home $$$', category: 'spam' },
  { phrase: 'telegram @', category: 'spam' },
  { phrase: 'whatsapp +', category: 'spam' },
];

/** Soft-flag phrases — publish but mark for review. */
export const FLAGGED_PHRASES: ReadonlyArray<{ phrase: string; category: ProfanityCategory }> = [
  { phrase: 'idiot', category: 'profanity' },
  { phrase: 'stupid idiot', category: 'profanity' },
  { phrase: 'shut up', category: 'profanity' },
  { phrase: 'dumbass', category: 'profanity' },
];

export function normalizeForModeration(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(normalized: string): string[] {
  return normalized.split(' ').filter(Boolean);
}
