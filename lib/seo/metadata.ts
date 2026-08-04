import type { Metadata } from 'next';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_OG_IMAGE_HEIGHT,
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

function resolveImageUrl(image: string): string {
  return image.startsWith('http') ? image : absoluteUrl(image);
}

/** Normalize path for canonicals: leading slash, no trailing slash (except root). */
export function normalizeCanonicalPath(path: string): string {
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  const q = p.indexOf('?');
  if (q !== -1) p = p.slice(0, q);
  return p || '/';
}

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
  const url = absoluteUrl(normalizeCanonicalPath(path));
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = resolveImageUrl(image);
  const isDefaultImage = image === DEFAULT_OG_IMAGE || image.endsWith('/og-default.png');

  return {
    // absolute avoids double suffix from root layout title.template
    title: { absolute: fullTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: openGraphType,
      locale: 'en_GB',
      images: [
        {
          url: imageUrl,
          alt: imageAlt,
          ...(isDefaultImage && {
            width: DEFAULT_OG_IMAGE_WIDTH,
            height: DEFAULT_OG_IMAGE_HEIGHT,
          }),
        },
      ],
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
      images: [imageUrl],
    },
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

export function buildNoIndexMetadata(title: string, path = '/auth'): Metadata {
  return buildPageMetadata({
    title,
    description: 'Private CadetMate area.',
    path,
    noIndex: true,
  });
}
