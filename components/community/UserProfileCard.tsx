'use client';

import Link from 'next/link';
import { Calendar, MessageSquare, FileText, Award } from 'lucide-react';
import { UserAvatar, RoleNameBadge } from '@/components/auth/onboarding/UserAvatar';
import { displayName, timeAgo } from '@/lib/community/utils';
import { PostCard } from './PostCard';
import type { Post } from '@/lib/community/types';

interface UserProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role?: string | null;
  avatar_kind?: string | null;
  avatar_preset?: string | null;
  avatar_color?: string | null;
  karma_score: number;
  post_count: number;
  comment_count: number;
}

interface UserProfileCardProps {
  profile: UserProfileData;
  recentPosts: Post[];
  recentComments: {
    id: string;
    body: string;
    created_at: string;
    vote_score: number;
    post: { id: string; title: string } | { id: string; title: string }[] | null;
  }[];
}

export function UserProfileCard({ profile, recentPosts, recentComments }: UserProfileCardProps) {
  const name = displayName(profile);
  const avatarKind = profile.avatar_kind === 'preset' ? 'preset' : 'initials';

  return (
    <div className="space-y-6">
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-4 overflow-visible">
          <UserAvatar
            fullName={name}
            avatarKind={avatarKind}
            avatarPreset={profile.avatar_preset ?? null}
            avatarColor={profile.avatar_color ?? null}
            size={64}
            showRoleBadge={false}
          />
          <div>
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-foreground">
              <span>{name}</span>
              <RoleNameBadge role={profile.role} />
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {timeAgo(profile.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-muted/60">
            <Award className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{profile.karma_score}</p>
            <p className="text-xs text-muted-foreground">Karma</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/60">
            <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{profile.post_count}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/60">
            <MessageSquare className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-foreground">{profile.comment_count}</p>
            <p className="text-xs text-muted-foreground">Comments</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Comments</h2>
        {recentComments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-2">
            {recentComments.map((c) => {
              const post = Array.isArray(c.post) ? c.post[0] : c.post;
              return (
                <div
                  key={c.id}
                  className="p-3 bg-card border border-border rounded-lg shadow-sm"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    on{' '}
                    {post ? (
                      <Link href={`/community/post/${post.id}`} className="text-primary hover:underline">
                        {post.title}
                      </Link>
                    ) : (
                      'a post'
                    )}{' '}
                    · {timeAgo(c.created_at)}
                  </p>
                  <p className="text-sm text-foreground/90 line-clamp-2">{c.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
