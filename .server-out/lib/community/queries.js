"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST_SELECT = void 0;
exports.attachPostTags = attachPostTags;
exports.attachUserVotes = attachUserVotes;
exports.normalizeAuthor = normalizeAuthor;
exports.asPost = asPost;
exports.POST_SELECT = `
  id, user_id, category_id, title, body, vote_score, comment_count,
  hot_score, status, is_deleted, created_at, updated_at,
  author:profiles!posts_user_id_fkey(id, full_name, email, created_at),
  category:post_categories(id, name, slug, description, color)
`;
async function attachPostTags(supabase, posts) {
    var _a;
    if (posts.length === 0)
        return posts;
    const ids = posts.map((p) => p.id);
    const { data: assignments } = await supabase
        .from('post_tag_assignments')
        .select('post_id, tag:post_tags(id, name, slug)')
        .in('post_id', ids);
    const tagMap = new Map();
    for (const row of assignments !== null && assignments !== void 0 ? assignments : []) {
        const list = (_a = tagMap.get(row.post_id)) !== null && _a !== void 0 ? _a : [];
        if (row.tag)
            list.push(row.tag);
        tagMap.set(row.post_id, list);
    }
    return posts.map((p) => { var _a; return (Object.assign(Object.assign({}, p), { tags: (_a = tagMap.get(p.id)) !== null && _a !== void 0 ? _a : [] })); });
}
async function attachUserVotes(supabase, userId, posts) {
    if (!userId || posts.length === 0)
        return posts;
    const ids = posts.map((p) => p.id);
    const { data: votes } = await supabase
        .from('votes')
        .select('target_id, value')
        .eq('user_id', userId)
        .eq('target_type', 'post')
        .in('target_id', ids);
    const voteMap = new Map((votes !== null && votes !== void 0 ? votes : []).map((v) => [v.target_id, v.value]));
    return posts.map((p) => { var _a; return (Object.assign(Object.assign({}, p), { user_vote: (_a = voteMap.get(p.id)) !== null && _a !== void 0 ? _a : null })); });
}
function normalizeAuthor(post) {
    var _a;
    const raw = post.author;
    const author = Array.isArray(raw) ? raw[0] : raw;
    const categoryRaw = post.category;
    const category = Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw;
    return Object.assign(Object.assign({}, post), { author: (_a = author) !== null && _a !== void 0 ? _a : null, category: category !== null && category !== void 0 ? category : null });
}
function asPost(row) {
    return normalizeAuthor(row);
}
