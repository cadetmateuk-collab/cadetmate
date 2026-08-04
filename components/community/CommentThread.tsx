'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { PostSkeletonList } from './PostSkeleton';
import { EmptyState } from './EmptyState';
import type { Comment } from '@/lib/community/types';

interface CommentThreadProps {
  postId: string;
  currentUserId?: string;
  onError?: (message: string) => void;
}

export function CommentThread({ postId, currentUserId, onError }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => fetchComments(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);

    try {
      if (editing) {
        const res = await fetch(`/api/community/comments/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }),
        });
        const data = await res.json();
        if (!res.ok) {
          onError?.(data.error ?? 'Failed to update comment');
          return;
        }
        setEditing(null);
        setBody('');
        await fetchComments();
        return;
      }

      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, parentId: replyTo, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError?.(data.error ?? 'Failed to post comment');
        return;
      }
      if (data.warning) onError?.(data.warning);
      setBody('');
      setReplyTo(null);
      await fetchComments();
    } catch {
      onError?.('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    const removeFromTree = (list: Comment[]): Comment[] =>
      list
        .filter((c) => c.id !== commentId)
        .map((c) => ({ ...c, replies: c.replies ? removeFromTree(c.replies) : [] }));
    setComments((prev) => removeFromTree(prev));
  };

  if (loading) return <PostSkeletonList count={3} />;

  return (
    <div className="space-y-4">
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="p-4 bg-card border border-border rounded-xl shadow-sm">
          {replyTo && (
            <p className="text-xs text-muted-foreground mb-2">
              Replying to comment ·{' '}
              <button type="button" className="text-primary hover:underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          )}
          {editing && (
            <p className="text-xs text-muted-foreground mb-2">
              Editing comment ·{' '}
              <button type="button" className="text-primary hover:underline" onClick={() => { setEditing(null); setBody(''); }}>
                Cancel
              </button>
            </p>
          )}
          <label htmlFor="comment-body" className="sr-only">
            {editing ? 'Edit comment' : replyTo ? 'Reply to comment' : 'Add a comment'}
          </label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={currentUserId ? 'Add a comment...' : 'Sign in to comment'}
            rows={3}
            maxLength={10000}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={submitting || !body.trim()}>
              {submitting ? 'Posting...' : editing ? 'Save' : 'Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          <a href="/auth?redirectTo=/community" className="text-primary hover:underline">Sign in</a> to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <EmptyState
          title="No comments yet"
          description="Be the first to share your thoughts on this post."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl px-4 divide-y divide-border shadow-sm">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={(id) => { setReplyTo(id); setEditing(null); }}
              onEdit={(c) => { setEditing(c); setBody(c.body); setReplyTo(null); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
