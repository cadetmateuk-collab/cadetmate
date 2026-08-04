import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildPageMetadata({
  title: 'Partners — Collaborators Supporting Cadet Training',
  description:
    'Meet CadetMate partners and collaborators supporting UK maritime cadet training, career pathways, and industry connections for deck cadets.',
  path: '/partners',
  keywords: [
    'CadetMate partners',
    'maritime industry partners',
    'deck cadet sponsorship',
    'merchant navy partnerships',
  ],
});

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Partners', path: '/partners' },
        ])}
      />
      {children}
    </>
  );
}
