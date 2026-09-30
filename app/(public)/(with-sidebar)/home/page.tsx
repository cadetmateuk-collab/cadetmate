import type { Metadata } from 'next';
import { preload } from 'react-dom';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildSoftwareApplicationSchema,
  buildFAQSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/feature/seo/JsonLd';
import { LandingPage } from '@/components/feature/home/landing/LandingPage';
import { getLandingPageStats, getTopCommunityPosts } from '@/lib/cache/queries';
import { LANDING_FAQS } from '@/lib/seo/faqs';

export const revalidate = 14400;

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'CadetMate — Walk into MCA Orals Prepared',
    description:
      'Stay organised from college to Officer of the Watch. CadetMate helps UK deck cadets revise COLREGS, track TRB, and practise MCA orals — free to start.',
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
          },
          posts,
        }}
      />
    </>
  );
}
