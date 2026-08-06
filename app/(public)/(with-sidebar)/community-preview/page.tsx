import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { MessageSquare, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cadet Community Preview — Connect with UK Deck Cadets',
  description:
    'Preview the CadetMate community where UK deck cadets ask questions, share study tips, and build reputation. Sign up free to join the conversation.',
  path: '/community-preview',
  keywords: [
    'deck cadet community',
    'maritime cadet forum',
    'cadetship discussion',
    'merchant navy cadet tips',
  ],
});

export default async function CommunityPreviewPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, body, vote_score, created_at')
    .order('vote_score', { ascending: false })
    .limit(10);

  return (
    <div className="w-full py-12 sm:py-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Community Preview', path: '/community-preview' },
        ])}
      />

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-h1 font-bold tracking-tight text-balance">Cadet Community</h1>
        <p className="text-muted-foreground mt-3">
          A Reddit-style community where cadets ask questions, share knowledge, and earn reputation.
        </p>
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 mb-8 text-center">
        <p className="font-medium">Join the conversation</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a free account to post, comment, vote, and build your reputation.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mt-4">
          <Button asChild><Link href="/auth?mode=signup">Sign Up Free</Link></Button>
          <Button variant="outline" asChild><Link href="/free-content">Browse Free Content</Link></Button>
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Trending Discussions</h2>
      <div className="space-y-3">
        {(posts ?? []).map((p) => (
          <div
            key={p.id}
            className="block p-5 rounded-2xl border border-border/60"
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-1" aria-hidden />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {p.vote_score ?? 0} votes · {new Date(p.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          </div>
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">No posts yet — be the first!</p>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Looking for study guides?{' '}
        <Link href="/resources" className="text-primary hover:underline inline-flex items-center gap-1">
          Free resources <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
