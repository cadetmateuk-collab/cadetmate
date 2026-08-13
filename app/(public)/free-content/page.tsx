import { JsonLd } from '@/components/seo/JsonLd';
import { FreeContentListing } from '@/components/blog/FreeContentListing';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { getAllBlogPosts } from '@/lib/blog/queries';
import {
  buildPageMetadata,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
  FREE_CONTENT_KEYWORDS,
  absoluteUrl,
} from '@/lib/seo';

// Same as article pages: always read live posts so new admin saves show up.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = buildPageMetadata({
  title: 'Free Maritime Training Articles & Cadet Resources',
  description:
    'Free articles and guides for UK deck cadets covering OOW exam prep, STCW revision, COLREGS, TRB tasks, sea survival, and cadetship advice from CadetMate.',
  path: '/free-content',
  keywords: [...FREE_CONTENT_KEYWORDS],
});

export default async function FreeContentPage() {
  const posts = await getAllBlogPosts();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/home' },
    { name: 'Free Content', path: '/free-content' },
  ]);

  const collectionSchema = buildCollectionPageSchema({
    name: 'Free Maritime Training Articles',
    description:
      'Free educational articles and guides for UK merchant navy deck cadets.',
    path: '/free-content',
    items: posts.map((post) => ({
      name: post.title,
      url: absoluteUrl(buildBlogPostPath(post)),
    })),
  });

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />
      <FreeContentListing posts={posts} />
    </>
  );
}
