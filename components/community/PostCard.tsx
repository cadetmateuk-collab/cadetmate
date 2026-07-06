'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { VoteControls } from './VoteControls';
import { timeAgo, displayName } from '@/lib/community/utils';
import type { Post } from '@/lib/community/types';
import { Badge } from '@/components/ui/badge';

interface PostCardProps {
  post: Post;
  showBody?: boolean;
  onVoteChange?: (postId: string, score: number) => void;
}

export function PostCard({ post, showBody = false, onVoteChange }: PostCardProps) {
  const authorName = displayName(post.author);
  const excerpt = post.body.length > 280 ? `${post.body.slice(0, 280)}…` : post.body;

  return (
    <article className="flex gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/25 transition-colors shadow-sm">
      <VoteControls
        targetType="post"
        targetId={post.id}
        score={post.vote_score}
        userVote={post.user_vote}
        onVote={(score) => onVoteChange?.(post.id, score)}
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
          {post.category && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium"
              style={{ borderColor: post.category.color ?? undefined, color: post.category.color ?? undefined }}
            >
              {post.category.name}
            </Badge>
          )}
          <Link
            href={`/community/user/${post.user_id}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {authorName}
          </Link>
          <span>·</span>
          <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
        </div>

        <Link href={`/community/post/${post.id}`} className="block group">
          <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
          {(showBody ? (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {post.body}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
              {excerpt}
            </p>
          ))}
        </Link>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <Link
            href={`/community/post/${post.id}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </Link>
        </div>
      </div>
    </article>
  );
}
