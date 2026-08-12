'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { VoteControls } from '@/components/community/VoteControls';
import { CommentThread } from '@/components/community/CommentThread';
import { CommunityAuthor } from '@/components/community/CommunityAuthor';
import { PostSkeleton } from '@/components/community/PostSkeleton';
import { ToastContainer } from '@/components/community/ToastContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/useToast';
import { timeAgo } from '@/lib/community/utils';
import type { Post } from '@/lib/community/types';
import { Badge } from '@/components/ui/badge';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toasts, addToast } = useToast();
  const [postId, setPostId] = useState<string>('');
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    params.then((p) => setPostId(p.id));
  }, [params]);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      const data = await res.json();
      if (res.ok) {
        setPost(data.post);
        setEditTitle(data.post.title);
        setEditBody(data.post.body);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  useEffect(() => {
    if (!postId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`post-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${postId}` },
        () => fetchPost(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchPost())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchPost]);

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      addToast('Post deleted');
      router.push('/community');
    } else {
      const data = await res.json();
      addToast(data.error ?? 'Failed to delete', 'error');
    }
  };

  const handleSaveEdit = async () => {
    const res = await fetch(`/api/community/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, body: editBody, categoryId: post?.category_id }),
    });
    const data = await res.json();
    if (res.ok) {
      setPost(data.post);
      setEditing(false);
      addToast('Post updated');
    } else {
      addToast(data.error ?? 'Failed to update', 'error');
    }
  };

  if (loading) {
    return <PostSkeleton />;
  }

  if (!post) {
    return (
      <div className="text-center cm-anim-1">
        <p className="text-muted-foreground">Post not found.</p>
        <Link href="/community" className="cm-back-link mt-2 inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Community
        </Link>
      </div>
    );
  }

  const isOwner = userId === post.user_id;

  return (
    <>
      <ToastContainer toasts={toasts} />

      <Link href="/community" className="cm-back-link">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </Link>

      <article className="flex gap-3 p-4 sm:p-6 bg-card border border-border rounded-xl mb-6 shadow-sm cm-anim-2">
        <VoteControls
          targetType="post"
          targetId={post.id}
          score={post.vote_score}
          userVote={post.user_vote}
        />

        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 overflow-visible text-xs text-muted-foreground">
            <CommunityAuthor userId={post.user_id} author={post.author} size={36} />
            {post.category && (
              <Badge variant="outline" style={{ borderColor: post.category.color ?? undefined, color: post.category.color ?? undefined }}>
                {post.category.name}
              </Badge>
            )}
            <span>·</span>
            <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
          </div>

          {editing ? (
            <div className="space-y-3">
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                {post.title}
              </h1>
              <div className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap break-words">
                {post.body}
              </div>
            </>
          )}

          {isOwner && !editing && (
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </article>

      <h2 className="text-lg font-semibold text-foreground mb-4 cm-anim-3">
        Discussion ({post.comment_count})
      </h2>

      <CommentThread
        postId={post.id}
        currentUserId={userId}
        onError={(msg) => addToast(msg, 'error')}
      />
    </>
  );
}
