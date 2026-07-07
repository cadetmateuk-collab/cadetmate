"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifySegment = slugifySegment;
exports.resolveCategorySlug = resolveCategorySlug;
exports.buildBlogPostPath = buildBlogPostPath;
/** URL-safe segment from a category label or slug field */
function slugifySegment(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
function resolveCategorySlug(post) {
    var _a, _b;
    const fromDb = (_a = post.category_slug) === null || _a === void 0 ? void 0 : _a.trim();
    if (fromDb)
        return fromDb;
    const fromLabel = slugifySegment((_b = post.category) !== null && _b !== void 0 ? _b : '');
    return fromLabel || 'general';
}
function buildBlogPostPath(post) {
    const categorySlug = resolveCategorySlug(post);
    return `/free-content/${categorySlug}/${post.slug}`;
}
