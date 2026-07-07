import type { Metadata } from 'next';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from './site';

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  openGraphType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
};

/** Build consistent page metadata with canonical URL, Open Graph, and Twitter tags. */
export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  keywords = [...DEFAULT_KEYWORDS],
  image = DEFAULT_OG_IMAGE,
  imageAlt = SITE_NAME,
  noIndex = false,
  openGraphType = 'website',
  publishedTime,
  modifiedTime,
  authors,
  section,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: openGraphType,
      locale: 'en_GB',
      images: [{ url: image, alt: imageAlt }],
      ...(openGraphType === 'article' && {
        publishedTime,
        modifiedTime,
        authors,
        section,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    ...(noIndex && {
      robots: { index: false, follow: false },
    }),
  };
}

type ArticleMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  author: string;
  date: string;
  updated_at?: string | null;
  category?: string | null;
  keywords?: string[];
};

/** Article-specific metadata with Open Graph article fields and canonical URL. */
export function buildArticleMetadata({
  title,
  description,
  path,
  image,
  author,
  date,
  updated_at,
  category,
  keywords,
}: ArticleMetadataOptions): Metadata {
  const isoDate = new Date(date).toISOString();
  const isoModified = updated_at ? new Date(updated_at).toISOString() : isoDate;

  return buildPageMetadata({
    title,
    description,
    path,
    keywords,
    image: image ?? undefined,
    imageAlt: title,
    openGraphType: 'article',
    publishedTime: isoDate,
    modifiedTime: isoModified,
    authors: [author],
    section: category ?? 'Maritime Training',
  });
}

export function buildNoIndexMetadata(title: string): Metadata {
  return buildPageMetadata({
    title,
    description: 'Private CadetMate area.',
    path: '/',
    noIndex: true,
  });
}
