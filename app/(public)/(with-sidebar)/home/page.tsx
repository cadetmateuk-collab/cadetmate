import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl } from '@/lib/seo/site';
import { LandingPage } from '@/components/home/landing/LandingPage';
import { getLandingPageStats, getTopCommunityPosts } from '@/lib/data/cached-queries';

export const metadata: Metadata = buildPageMetadata({
  title: 'Your Complete Cadetship Companion',
  description:
    'One platform to support every stage of your cadetship. College modules, assignments, TRB, sea phases, flashcards, scenarios, and MCA oral prep — free to start.',
  path: '/home',
});

export default async function HomePage() {
  const headerStore = await headers();
  if (headerStore.get('x-user-id')) {
    redirect('/dashboard');
  }

  const [stats, posts] = await Promise.all([
    getLandingPageStats(),
    getTopCommunityPosts(),
  ]);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CadetMate',
        url: absoluteUrl('/home'),
        description: 'All-in-one maritime learning platform for UK deck cadets — from college through sea phases to qualification.',
        potentialAction: {
          '@type': 'SearchAction',
          target: absoluteUrl('/unit-modules'),
          'query-input': 'required name=search_term',
        },
      }} />

      <LandingPage
        data={{
          stats: {
            users: stats.users,
            modules: stats.modules,
            flashcards: stats.flashcards,
            posts: stats.posts,
            questions: 2500,
            simulators: 12,
          },
          posts,
        }}
      />
    </>
  );
}
