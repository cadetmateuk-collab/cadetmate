import { SITE_NAME, SITE_URL, absoluteUrl, DEFAULT_OG_IMAGE } from './site';
import { buildBlogPostPath } from '@/lib/blog/paths';

export type BreadcrumbItem = { name: string; path: string };

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      'CadetMate is a maritime training platform built for UK deck cadets, offering interactive modules, revision tools, and free educational content.',
    sameAs: [] as string[],
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleSchema(post: {
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  date: string;
  updated_at?: string | null;
  image?: string | null;
  category?: string | null;
  category_slug?: string | null;
}) {
  const url = absoluteUrl(buildBlogPostPath(post));
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image ? [post.image] : [absoluteUrl(DEFAULT_OG_IMAGE)],
    datePublished: post.date,
    dateModified: post.updated_at ?? post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(DEFAULT_OG_IMAGE),
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: post.category ?? 'Maritime Training',
    inLanguage: 'en-GB',
  };
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildCollectionPageSchema(options: {
  name: string;
  description: string;
  path: string;
  items: { name: string; url: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    hasPart: options.items.map((item) => ({
      '@type': 'Article',
      name: item.name,
      url: item.url,
    })),
  };
}
