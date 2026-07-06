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
      type: 'website',
      locale: 'en_GB',
      images: [{ url: image, alt: imageAlt }],
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

export function buildNoIndexMetadata(title: string): Metadata {
  return buildPageMetadata({
    title,
    description: 'Private CadetMate area.',
    path: '/',
    noIndex: true,
  });
}
