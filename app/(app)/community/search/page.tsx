'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PostCard } from '@/components/community/PostCard';
import { PostSkeletonList } from '@/components/community/PostSkeleton';
import { displayName } from '@/lib/community/utils';
import type { Post } from '@/lib/community/types';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    posts: Post[];
    users: { id: string; full_name: string | null; email: string | null; karma_score: number }[];
    categories: { id: string; name: string; slug: string; color: string | null }[];
  }>({ posts: [], users: [], categories: [] });

  useEffect(() => {
    if (q.length < 2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/community/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setResults)
      .finally(() => setLoading(false));
  }, [q]);

  if (q.length < 2) {
    return <p className="text-sm text-muted-foreground">Enter at least 2 characters to search.</p>;
  }

  if (loading) return <PostSkeletonList count={3} />;

  const hasResults =
    results.posts.length > 0 || results.users.length > 0 || results.categories.length > 0;

  if (!hasResults) {
    return <p className="text-sm text-muted-foreground">No results found for &ldquo;{q}&rdquo;.</p>;
  }

  return (
    <div className="space-y-8 cm-anim-2">
      {results.posts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Posts</h2>
          <div className="space-y-3">
            {results.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {results.users.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Users</h2>
          <div className="space-y-2">
            {results.users.map((user) => (
              <Link
                key={user.id}
                href={`/community/user/${user.id}`}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors shadow-sm"
              >
                <span className="font-medium text-foreground">
                  {displayName(user)}
                </span>
                <span className="text-xs text-muted-foreground">{user.karma_score} karma</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.categories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {results.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/community?category=${cat.slug}`}
                className="px-4 py-2 rounded-full text-sm font-medium border border-border bg-card transition-colors hover:border-primary/40"
                style={{ borderColor: cat.color ?? undefined, color: cat.color ?? undefined }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <Link href="/community" className="cm-back-link">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </Link>

      <h1 className="cm-page-title mb-6 cm-anim-1">Search Results</h1>

      <Suspense fallback={<PostSkeletonList count={3} />}>
        <SearchResults />
      </Suspense>
    </>
  );
}
