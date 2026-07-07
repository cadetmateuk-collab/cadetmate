"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBlogPosts = void 0;
exports.getBlogPostBySlug = getBlogPostBySlug;
exports.getBlogPostByCategoryAndSlug = getBlogPostByCategoryAndSlug;
exports.getRelatedBlogPosts = getRelatedBlogPosts;
exports.getBlogPostSlugs = getBlogPostSlugs;
const cache_1 = require("next/cache");
const public_1 = require("@/lib/supabase/public");
const paths_1 = require("@/lib/blog/paths");
const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 120 : 300;
const SUMMARY_FIELDS = 'id, title, excerpt, slug, author, author_avatar, date, category, category_slug, image, read_time, featured';
exports.getAllBlogPosts = (0, cache_1.unstable_cache)(async () => {
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('blog_posts')
        .select(SUMMARY_FIELDS)
        .eq('hidden', false)
        .order('date', { ascending: false });
    return (data !== null && data !== void 0 ? data : []);
}, ['all-blog-posts'], { revalidate: REVALIDATE_SECONDS });
async function getBlogPostBySlug(slug) {
    var _a;
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('hidden', false)
        .single();
    return (_a = data) !== null && _a !== void 0 ? _a : null;
}
async function getBlogPostByCategoryAndSlug(categorySlug, slug) {
    var _a;
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('hidden', false);
    const posts = (data !== null && data !== void 0 ? data : []);
    return (_a = posts.find((p) => (0, paths_1.resolveCategorySlug)(p) === categorySlug)) !== null && _a !== void 0 ? _a : null;
}
async function getRelatedBlogPosts(currentSlug, category, limit = 3) {
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('blog_posts')
        .select(SUMMARY_FIELDS)
        .eq('hidden', false)
        .eq('category', category)
        .neq('slug', currentSlug)
        .order('date', { ascending: false })
        .limit(limit);
    const related = (data !== null && data !== void 0 ? data : []);
    if (related.length >= limit)
        return related;
    const { data: fallback } = await supabase
        .from('blog_posts')
        .select(SUMMARY_FIELDS)
        .eq('hidden', false)
        .neq('slug', currentSlug)
        .order('date', { ascending: false })
        .limit(limit);
    const merged = [...related];
    for (const post of (fallback !== null && fallback !== void 0 ? fallback : [])) {
        if (merged.length >= limit)
            break;
        if (!merged.some((p) => p.slug === post.slug))
            merged.push(post);
    }
    return merged.slice(0, limit);
}
async function getBlogPostSlugs() {
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('blog_posts')
        .select('slug, category, category_slug')
        .eq('hidden', false);
    return (data !== null && data !== void 0 ? data : []).map((p) => ({
        category: (0, paths_1.resolveCategorySlug)(p),
        slug: p.slug,
    }));
}
