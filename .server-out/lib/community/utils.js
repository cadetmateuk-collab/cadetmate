"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeAgo = timeAgo;
exports.slugify = slugify;
exports.sanitizeText = sanitizeText;
exports.displayName = displayName;
exports.getInitials = getInitials;
exports.formatScore = formatScore;
exports.topPeriodToDate = topPeriodToDate;
function timeAgo(date) {
    const now = Date.now();
    const then = new Date(date).getTime();
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60)
        return seconds <= 1 ? 'just now' : `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)
        return days === 1 ? '1 day ago' : `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12)
        return months === 1 ? '1 month ago' : `${months} months ago`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
}
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/** Strip HTML tags and encode entities for XSS protection */
function sanitizeText(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}
function displayName(author) {
    var _a;
    if (!author)
        return 'Anonymous';
    if ((_a = author.full_name) === null || _a === void 0 ? void 0 : _a.trim())
        return author.full_name.trim();
    if (author.email)
        return author.email.split('@')[0];
    return 'User';
}
function getInitials(name) {
    return name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
function formatScore(score) {
    if (Math.abs(score) >= 10000)
        return `${(score / 1000).toFixed(1)}k`;
    return String(score);
}
function topPeriodToDate(period) {
    const now = new Date();
    switch (period) {
        case '24h':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case 'week':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
            return null;
    }
}
