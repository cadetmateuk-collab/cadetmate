import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  SITE_LOGO,
  SOCIAL_PROFILES,
  SUPPORT_EMAIL,
  DEFAULT_DESCRIPTION,
} from './site';
import { buildBlogPostPath } from '@/lib/blog/paths';

export type BreadcrumbItem = { name: string; path: string };

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(SITE_LOGO),
      width: 1080,
      height: 1080,
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      'CadetMate is a maritime training platform built for UK deck cadets, offering interactive modules, revision tools, simulators, and free educational content.',
    email: SUPPORT_EMAIL,
    contactPoint: {
      '@type': 'ContactPoint',
      email: SUPPORT_EMAIL,
      contactType: 'customer support',
      availableLanguage: ['English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    ...(SOCIAL_PROFILES.length > 0 ? { sameAs: SOCIAL_PROFILES } : {}),
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-GB',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/free-content')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web, iOS, Android',
    url: absoluteUrl('/home'),
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
      description: 'Free plan available; premium upgrades unlock full modules and tools.',
    },
    provider: { '@id': `${SITE_URL}/#organization` },
  };
}

export function buildServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Maritime Cadet Training Platform',
    serviceType: 'Online education',
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    description:
      'Interactive learning modules, flashcards, MCA oral prep, TRB support, and simulators for UK merchant navy deck cadets.',
    url: absoluteUrl('/pricing'),
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

function toIsoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function resolveSchemaImage(image?: string | null): string[] {
  if (image?.startsWith('http')) return [image];
  if (image?.startsWith('/')) return [absoluteUrl(image)];
  return [absoluteUrl(DEFAULT_OG_IMAGE)];
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
  const published = toIsoDate(post.date) ?? new Date().toISOString();
  const modified = toIsoDate(post.updated_at) ?? published;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title.slice(0, 110),
    description: post.excerpt,
    image: resolveSchemaImage(post.image),
    datePublished: published,
    dateModified: modified,
    author: {
      '@type': 'Person',
      name: post.author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SITE_LOGO),
        width: 1080,
        height: 1080,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: post.category ?? 'Maritime Training',
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
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

export function buildContactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${SITE_NAME}`,
    url: absoluteUrl('/contact'),
    mainEntity: {
      '@type': 'Organization',
      name: SITE_NAME,
      email: SUPPORT_EMAIL,
      url: SITE_URL,
    },
  };
}

/** Product/Offer schema for pricing tiers. */
export function buildOfferCatalogSchema(offers: {
  name: string;
  description: string;
  price?: string;
  priceCurrency?: string;
  url: string;
}[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `${SITE_NAME} Plans`,
    itemListElement: offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      description: offer.description,
      ...(offer.price !== undefined ? { price: offer.price, priceCurrency: offer.priceCurrency ?? 'GBP' } : {}),
      url: absoluteUrl(offer.url),
      availability: 'https://schema.org/InStock',
    })),
  };
}
