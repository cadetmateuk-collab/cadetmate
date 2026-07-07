'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FeedFilters } from '@/components/community/FeedFilters';
import { PostCard } from '@/components/community/PostCard';
import { PostForm } from '@/components/community/PostForm';
import { CommunitySearch } from '@/components/community/CommunitySearch';
import { PostSkeletonList } from '@/components/community/PostSkeleton';
import { EmptyState } from '@/components/community/EmptyState';
import { ToastContainer } from '@/components/community/ToastContainer';
import { useToast } from '@/lib/hooks/useToast';
import { useCommunityFeed, useCategories, useInfiniteScroll } from '@/lib/hooks/useCommunityFeed';
import { CommunityLeaderboard } from '@/components/community/CommunityLeaderboard';
import type { FeedSort, TopPeriod } from '@/lib/community/types';

function parseSort(value: string | null): FeedSort {
  if (value === 'new' || value === 'top' || value === 'hot') return value;
  return 'hot';
}

function CommunityFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, addToast } = useToast();
  const activeTab = searchParams.get('tab');
  const urlSort = searchParams.get('sort');
  const urlFilter = searchParams.get('filter');

  const [sort, setSort] = useState<FeedSort>(() => parseSort(urlSort));
  const [period, setPeriod] = useState<TopPeriod>('all');
  const [category, setCategory] = useState<string | undefined>(searchParams.get('category') ?? undefined);
  const [feedFilter, setFeedFilter] = useState<'mine' | 'saved' | undefined>(
    urlFilter === 'mine' || urlFilter === 'saved' ? urlFilter : undefined,
  );
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const categories = useCategories();

  const { posts, loading, loadingMore, hasMore, error, loadMore, updatePostScore } = useCommunityFeed({
    sort,
    period,
    category,
    filter: feedFilter,
  });

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);

    const nextSort = parseSort(searchParams.get('sort'));
    setSort(nextSort);

    const nextFilter = searchParams.get('filter');
    setFeedFilter(nextFilter === 'mine' || nextFilter === 'saved' ? nextFilter : undefined);
  }, [searchParams]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    const query = params.toString();
    router.replace(query ? `/community?${query}` : '/community', { scroll: false });
  };

  const handleSortChange = (nextSort: FeedSort) => {
    setSort(nextSort);
    updateUrl({ sort: nextSort === 'hot' ? null : nextSort, tab: null });
  };

  const handleCreateClick = () => {
    if (!userId) {
      router.push('/auth?redirectTo=/community');
      return;
    }
    setShowForm(true);
  };

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 cm-anim-1">
        <div>
          <h1 className="cm-page-title">Community</h1>
          <p className="cm-page-subtitle">
            Discuss training, share tips, and connect with fellow cadets.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      <div className="mb-6 cm-anim-2">
        <CommunitySearch />
      </div>

      {showForm && (
        <div className="mb-6 cm-anim-2">
          <PostForm
            categories={categories}
            onSuccess={() => {
              setShowForm(false);
              addToast('Post published!');
            }}
            onError={(msg) => addToast(msg, 'error')}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="mb-4 cm-anim-3">
        {activeTab === 'leaderboard' ? (
          <CommunityLeaderboard />
        ) : (
          <>
            <FeedFilters
              sort={sort}
              period={period}
              category={category}
              categories={categories}
              onSortChange={handleSortChange}
              onPeriodChange={setPeriod}
              onCategoryChange={(cat) => {
                setCategory(cat);
                updateUrl({ category: cat ?? null });
              }}
            />

            {feedFilter && (
              <p className="mt-3 text-xs text-muted-foreground">
                Showing {feedFilter === 'mine' ? 'your posts' : 'saved posts'}.
                <button
                  type="button"
                  className="ml-1 text-primary hover:underline"
                  onClick={() => {
                    setFeedFilter(undefined);
                    updateUrl({ filter: null });
                  }}
                >
                  Clear filter
                </button>
              </p>
            )}
          </>
        )}
      </div>

      {activeTab !== 'leaderboard' && error && (
        <div className="p-4 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {activeTab !== 'leaderboard' && loading ? (
        <PostSkeletonList />
      ) : activeTab !== 'leaderboard' && posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Start the conversation — create the first post in this community."
          actionLabel="Create Post"
          onAction={handleCreateClick}
        />
      ) : activeTab !== 'leaderboard' ? (
        <div className="space-y-3 cm-anim-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVoteChange={updatePostScore}
            />
          ))}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && <PostSkeletonList count={2} />}
        </div>
      ) : null}
    </>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<PostSkeletonList />}>
      <CommunityFeed />
    </Suspense>
  );
}
