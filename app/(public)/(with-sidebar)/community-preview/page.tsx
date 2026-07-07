import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { MessageSquare, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'Community Preview',
  description: 'See what cadets are discussing in the CadetMate community.',
  path: '/community-preview',
});

export default async function CommunityPreviewPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, body, vote_score, created_at')
    .order('vote_score', { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Cadet Community</h1>
        <p className="text-muted-foreground mt-3">
          A Reddit-style community where cadets ask questions, share knowledge, and earn reputation.
        </p>
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 mb-8 text-center">
        <p className="font-medium">Join the conversation</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a free account to post, comment, vote, and build your reputation.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <Button asChild><Link href="/auth?mode=signup">Sign Up Free</Link></Button>
          <Button variant="outline" asChild><Link href="/community">View Full Feed</Link></Button>
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Trending Discussions</h2>
      <div className="space-y-3">
        {(posts ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/community/post/${p.id}`}
            className="block p-5 rounded-2xl border border-border/60 hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {p.vote_score ?? 0} votes · {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">No posts yet — be the first!</p>
        )}
      </div>
    </div>
  );
}
