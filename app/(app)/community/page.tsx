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
import type { FeedSort, TopPeriod } from '@/lib/community/types';

function CommunityFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, addToast } = useToast();
  const [sort, setSort] = useState<FeedSort>('hot');
  const [period, setPeriod] = useState<TopPeriod>('all');
  const [category, setCategory] = useState<string | undefined>(searchParams.get('category') ?? undefined);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const categories = useCategories();

  const { posts, loading, loadingMore, hasMore, error, loadMore, updatePostScore } = useCommunityFeed({
    sort,
    period,
    category,
  });

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
  }, [searchParams]);

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
        <FeedFilters
          sort={sort}
          period={period}
          category={category}
          categories={categories}
          onSortChange={setSort}
          onPeriodChange={setPeriod}
          onCategoryChange={setCategory}
        />
      </div>

      {error && (
        <div className="p-4 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <PostSkeletonList />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Start the conversation — create the first post in this community."
          actionLabel="Create Post"
          onAction={handleCreateClick}
        />
      ) : (
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
      )}
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
