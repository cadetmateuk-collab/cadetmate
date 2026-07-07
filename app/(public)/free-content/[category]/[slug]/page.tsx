import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ArticleFAQ } from '@/components/blog/ArticleFAQ';
import { RelatedArticles, ArticleCTA } from '@/components/blog/RelatedArticles';
import { BlogHeroImage } from '@/components/blog/BlogImage';
import { getBlogPostByCategoryAndSlug, getRelatedBlogPosts, getBlogPostSlugs } from '@/lib/blog/queries';
import { buildBlogPostPath } from '@/lib/blog/paths';
import {
  renderArticleContent,
  extractHeadings,
  extractFAQItems,
  splitContentSections,
} from '@/lib/blog/markdown';
import {
  buildArticleMetadata,
  buildArticleKeywords,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildOrganizationSchema,
} from '@/lib/seo';

export const revalidate = 300;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const post = await getBlogPostByCategoryAndSlug(category, slug);
  if (!post) notFound();

  const postPath = buildBlogPostPath(post);
  const relatedPosts = await getRelatedBlogPosts(slug, post.category, 3);
  const { faqSection } = splitContentSections(post.content);
  const headings = extractHeadings(post.content);
  const faqs = extractFAQItems(faqSection);

  const formattedDate = new Date(post.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const breadcrumbItems = [
    { name: 'Home', path: '/home' },
    { name: 'Free Content', path: '/free-content' },
    { name: post.title, path: postPath },
  ];

  const faqSchema = buildFAQSchema(faqs);

  return (
    <article className="min-h-[100dvh] pb-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={buildArticleSchema(post)} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            {post.category}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 border-b border-border pb-5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date} className="inline-flex items-center gap-1">
              <Calendar size={12} aria-hidden />
              {formattedDate}
            </time>
            {post.read_time && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden />
                  {post.read_time}
                </span>
              </>
            )}
          </div>

          {post.excerpt && (
            <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-[0.9375rem] italic text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {post.image && (
          <div className="mb-8">
            <BlogHeroImage src={post.image} alt={post.title} priority />
          </div>
        )}

        <TableOfContents headings={headings} />

        <div className="prose-spacing flex flex-col gap-5 text-left">
          {renderArticleContent(post.content)}
        </div>

        <ArticleFAQ faqs={faqs} />
        <RelatedArticles posts={relatedPosts} />
        <ArticleCTA />

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-5">
          <Link
            href="/free-content"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} aria-hidden />
            All articles
          </Link>
          <Link
            href="/resources"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
          >
            Free resources
          </Link>
        </footer>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  return getBlogPostSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getBlogPostByCategoryAndSlug(category, slug);
  if (!post) return {};

  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt || `Read ${post.title} — free maritime training article for UK deck cadets.`,
    path: buildBlogPostPath(post),
    image: post.image,
    author: post.author,
    date: post.date,
    updated_at: post.updated_at,
    category: post.category,
    keywords: buildArticleKeywords(post.category, post.title),
  });
}
