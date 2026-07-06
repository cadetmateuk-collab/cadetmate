'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { VoteControls } from './VoteControls';
import { Button } from '@/components/ui/button';
import { timeAgo, displayName } from '@/lib/community/utils';
import type { Comment } from '@/lib/community/types';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = currentUserId === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/community/comments/${comment.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-4 sm:ml-6 border-l-2 border-border pl-3' : ''}>
      <div className="flex gap-2 py-3">
        <VoteControls
          targetType="comment"
          targetId={comment.id}
          score={comment.vote_score}
          userVote={comment.user_vote}
          compact
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            {hasReplies && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="p-0.5 hover:bg-muted rounded"
                aria-label={collapsed ? 'Expand thread' : 'Collapse thread'}
              >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
            <Link
              href={`/community/user/${comment.user_id}`}
              className="font-medium hover:text-primary"
            >
              {displayName(comment.author)}
            </Link>
            <span>·</span>
            <time dateTime={comment.created_at}>{timeAgo(comment.created_at)}</time>
          </div>

          {!collapsed && (
            <>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                {comment.body}
              </p>

              <div className="flex items-center gap-2 mt-2">
                {currentUserId && comment.depth < 10 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => onReply(comment.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
                {isOwner && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => onEdit(comment)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {collapsed && hasReplies && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="text-xs text-primary hover:underline"
            >
              Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {!collapsed && hasReplies && (
        <div>
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
