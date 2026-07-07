'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCommunityFeed = useCommunityFeed;
exports.useCategories = useCategories;
exports.useInfiniteScroll = useInfiniteScroll;
const react_1 = require("react");
const client_1 = require("@/lib/supabase/client");
function useCommunityFeed({ sort, period, category }) {
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [loadingMore, setLoadingMore] = (0, react_1.useState)(false);
    const [cursor, setCursor] = (0, react_1.useState)(null);
    const [hasMore, setHasMore] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchPosts = (0, react_1.useCallback)(async (append = false, nextCursor) => {
        var _a;
        if (append)
            setLoadingMore(true);
        else
            setLoading(true);
        try {
            const params = new URLSearchParams({ sort, period: period !== null && period !== void 0 ? period : 'all', limit: '20' });
            if (category)
                params.set('category', category);
            if (append && nextCursor)
                params.set('cursor', nextCursor);
            const res = await fetch(`/api/community/posts?${params}`);
            const data = await res.json();
            if (!res.ok) {
                setError((_a = data.error) !== null && _a !== void 0 ? _a : 'Failed to load posts');
                return;
            }
            setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
            setError(null);
        }
        catch (_b) {
            setError('Failed to load posts');
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sort, period, category]);
    (0, react_1.useEffect)(() => {
        fetchPosts(false);
    }, [fetchPosts]);
    (0, react_1.useEffect)(() => {
        const supabase = (0, client_1.createClient)();
        const channel = supabase
            .channel('community-feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            fetchPosts(false);
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
            fetchPosts(false);
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts]);
    const loadMore = (0, react_1.useCallback)(() => {
        if (!loadingMore && hasMore && cursor) {
            fetchPosts(true, cursor);
        }
    }, [loadingMore, hasMore, cursor, fetchPosts]);
    const updatePostScore = (0, react_1.useCallback)((postId, score) => {
        setPosts((prev) => prev.map((p) => (p.id === postId ? Object.assign(Object.assign({}, p), { vote_score: score }) : p)));
    }, []);
    return {
        posts,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        updatePostScore,
        refresh: () => fetchPosts(false),
    };
}
function useCategories() {
    const [categories, setCategories] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        fetch('/api/community/categories')
            .then((r) => r.json())
            .then((d) => { var _a; return setCategories((_a = d.categories) !== null && _a !== void 0 ? _a : []); })
            .catch(() => { });
    }, []);
    return categories;
}
function useInfiniteScroll(loadMore, hasMore, loading) {
    const sentinelRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const el = sentinelRef.current;
        if (!el)
            return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadMore();
            }
        }, { rootMargin: '200px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [loadMore, hasMore, loading]);
    return sentinelRef;
}
