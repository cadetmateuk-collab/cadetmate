'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Post, FeedSort, TopPeriod, PostCategory } from '@/lib/community/types';

interface UseCommunityFeedOptions {
  sort: FeedSort;
  period: TopPeriod;
  category?: string;
}

export function useCommunityFeed({ sort, period, category }: UseCommunityFeedOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (append = false, nextCursor?: string | null) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({ sort, period: period ?? 'all', limit: '20' });
        if (category) params.set('category', category);
        if (append && nextCursor) params.set('cursor', nextCursor);

        const res = await fetch(`/api/community/posts?${params}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? 'Failed to load posts');
          return;
        }

        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setError(null);
      } catch {
        setError('Failed to load posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, period, category],
  );

  useEffect(() => {
    fetchPosts(false);
  }, [fetchPosts]);

  useEffect(() => {
    const supabase = createClient();
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

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && cursor) {
      fetchPosts(true, cursor);
    }
  }, [loadingMore, hasMore, cursor, fetchPosts]);

  const updatePostScore = useCallback((postId: string, score: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, vote_score: score } : p)),
    );
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

export function useCategories() {
  const [categories, setCategories] = useState<PostCategory[]>([]);

  useEffect(() => {
    fetch('/api/community/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  return categories;
}

export function useInfiniteScroll(loadMore: () => void, hasMore: boolean, loading: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  return sentinelRef;
}
