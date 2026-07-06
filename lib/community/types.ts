export type ContentStatus = 'published' | 'removed' | 'flagged' | 'pending';
export type VoteTarget = 'post' | 'comment';
export type FeedSort = 'hot' | 'new' | 'top';
export type TopPeriod = '24h' | 'week' | 'month' | 'all';

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
}

export interface CommunityProfile {
  user_id: string;
  karma_score: number;
  post_count: number;
  comment_count: number;
  created_at: string;
}

export interface AuthorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  community_user_profiles?: CommunityProfile | null;
}

export interface Post {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  body: string;
  vote_score: number;
  comment_count: number;
  hot_score: number;
  status: ContentStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: AuthorProfile | null;
  category?: PostCategory | null;
  tags?: PostTag[];
  user_vote?: number | null;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  body: string;
  vote_score: number;
  depth: number;
  status: ContentStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: AuthorProfile | null;
  user_vote?: number | null;
  replies?: Comment[];
}

export interface Vote {
  id: string;
  user_id: string;
  target_type: VoteTarget;
  target_id: string;
  value: -1 | 1;
}

export interface ModerationResult {
  action: 'approved' | 'blocked' | 'flagged';
  explanation: string;
  categories: string[];
  toxicityScore: number | null;
  provider: string;
  raw?: unknown;
}

export interface FeedParams {
  sort: FeedSort;
  period?: TopPeriod;
  category?: string;
  cursor?: string;
  limit?: number;
}

export interface SearchParams {
  q: string;
  type?: 'posts' | 'users' | 'categories' | 'all';
  limit?: number;
}
