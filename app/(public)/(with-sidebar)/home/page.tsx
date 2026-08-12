import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { preload } from 'react-dom';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildSoftwareApplicationSchema,
  buildFAQSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { LandingPage } from '@/components/home/landing/LandingPage';
import { getLandingPageStats, getTopCommunityPosts } from '@/lib/data/cached-queries';
import { LANDING_FAQS } from '@/lib/seo/faqs';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'CadetMate — UK Deck Cadet Training for COLREGS, TRB & MCA Orals',
    description:
      'CadetMate helps UK merchant navy deck cadets train for college, sea phases, COLREGS, TRB tasks, STCW topics, and MCA oral exams. Free guides and free account to start.',
    path: '/home',
    keywords: [
      'UK deck cadet training',
      'COLREGS training',
      'MCA oral exam prep',
      'TRB deck cadet',
      'STCW revision',
      'merchant navy cadet',
      'OOW training',
      'deck cadet flashcards',
    ],
  }),
};

export default async function HomePage() {
  preload('/images/logo.webp', { as: 'image', type: 'image/webp' });
  preload('/images/c2.webp', { as: 'image', type: 'image/webp' });

  const headerStore = await headers();
  if (headerStore.get('x-user-id')) {
    redirect('/dashboard');
  }

  const [stats, posts] = await Promise.all([
    getLandingPageStats(),
    getTopCommunityPosts(),
  ]);

  const faqSchema = buildFAQSchema([...LANDING_FAQS]);

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildSoftwareApplicationSchema()} />
      {faqSchema && <JsonLd data={faqSchema} />}

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
