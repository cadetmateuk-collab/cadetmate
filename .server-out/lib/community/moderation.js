"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateContent = moderateContent;
const FLAG_CATEGORIES = [
    'hate',
    'harassment',
    'violence',
    'sexual',
    'self-harm',
    'spam',
    'toxicity',
];
const SPAM_PATTERNS = [
    /(?:https?:\/\/){3,}/i,
    /(?:buy now|click here|free money|crypto giveaway)/i,
    /(.)\1{10,}/,
];
function basicModeration(text) {
    const lower = text.toLowerCase();
    const flagged = [];
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(text))
            flagged.push('spam');
    }
    const toxicWords = ['kill yourself', 'kys', 'nazi', 'rape'];
    for (const word of toxicWords) {
        if (lower.includes(word))
            flagged.push('toxicity');
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
async function openaiModeration(text) {
    var _a, _b, _c;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        return null;
    try {
        const res = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ input: text }),
        });
        if (!res.ok)
            return null;
        const data = await res.json();
        const result = (_a = data.results) === null || _a === void 0 ? void 0 : _a[0];
        if (!result)
            return null;
        const categories = [];
        const scores = [];
        for (const cat of FLAG_CATEGORIES) {
            if ((_b = result.categories) === null || _b === void 0 ? void 0 : _b[cat])
                categories.push(cat);
            if (typeof ((_c = result.category_scores) === null || _c === void 0 ? void 0 : _c[cat]) === 'number') {
                scores.push(result.category_scores[cat]);
            }
        }
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
        if (result.flagged || maxScore >= 0.85) {
            return {
                action: 'blocked',
                explanation: 'Your content violates our community guidelines and cannot be published. Please remove harmful, harassing, or inappropriate language.',
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
    }
    catch (_d) {
        return null;
    }
}
async function moderateContent(text) {
    const openai = await openaiModeration(text);
    if (openai)
        return openai;
    return basicModeration(text);
}
