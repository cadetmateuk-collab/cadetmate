"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentBlogPosts = exports.getRecentCommunityPosts = exports.getTopCommunityPosts = exports.getLandingPageStats = void 0;
const cache_1 = require("next/cache");
const public_1 = require("@/lib/supabase/public");
const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 120 : 300;
exports.getLandingPageStats = (0, cache_1.unstable_cache)(async () => {
    var _a, _b, _c, _d;
    const supabase = (0, public_1.createPublicSupabase)();
    const [users, modules, flashcards, posts] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('modules').select('*', { count: 'exact', head: true }).eq('hidden', false),
        supabase.from('flashcard_packs').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
    ]);
    return {
        users: (_a = users.count) !== null && _a !== void 0 ? _a : 0,
        modules: (_b = modules.count) !== null && _b !== void 0 ? _b : 0,
        flashcards: (_c = flashcards.count) !== null && _c !== void 0 ? _c : 0,
        posts: (_d = posts.count) !== null && _d !== void 0 ? _d : 0,
    };
}, ['landing-page-stats'], { revalidate: REVALIDATE_SECONDS });
exports.getTopCommunityPosts = (0, cache_1.unstable_cache)(async () => {
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('posts')
        .select('id, title, body, vote_score, created_at')
        .order('vote_score', { ascending: false })
        .limit(5);
    return data !== null && data !== void 0 ? data : [];
}, ['top-community-posts'], { revalidate: REVALIDATE_SECONDS });
exports.getRecentCommunityPosts = (0, cache_1.unstable_cache)(async () => {
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('posts')
        .select('id, title, created_at, vote_score')
        .order('created_at', { ascending: false })
        .limit(3);
    return data !== null && data !== void 0 ? data : [];
}, ['recent-community-posts'], { revalidate: REVALIDATE_SECONDS });
exports.getRecentBlogPosts = (0, cache_1.unstable_cache)(async () => {
    const supabase = (0, public_1.createPublicSupabase)();
    const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, date')
        .eq('hidden', false)
        .order('date', { ascending: false })
        .limit(3);
    return data !== null && data !== void 0 ? data : [];
}, ['recent-blog-posts'], { revalidate: REVALIDATE_SECONDS });
