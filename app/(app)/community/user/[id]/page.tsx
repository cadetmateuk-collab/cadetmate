'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserProfileCard } from '@/components/community/UserProfileCard';
import { PostSkeleton } from '@/components/community/PostSkeleton';
import type { Post } from '@/lib/community/types';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    profile: {
      id: string;
      full_name: string | null;
      email: string | null;
      created_at: string;
      karma_score: number;
      post_count: number;
      comment_count: number;
    };
    recentPosts: Post[];
    recentComments: {
      id: string;
      body: string;
      created_at: string;
      vote_score: number;
      post: { id: string; title: string } | { id: string; title: string }[] | null;
    }[];
  } | null>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/community/users/${userId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <PostSkeleton />;
  }

  if (!data?.profile) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Link href="/community" className="cm-back-link mt-2 inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/community" className="cm-back-link">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </Link>

      <UserProfileCard
        profile={data.profile}
        recentPosts={data.recentPosts}
        recentComments={data.recentComments}
      />
    </>
  );
}
