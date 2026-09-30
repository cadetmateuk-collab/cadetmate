import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/feature/seo/JsonLd';
import { LegalDocument } from '@/components/feature/legal/LegalDocument';
import { SUPPORT_EMAIL } from '@/lib/seo/site';
import { LEGAL_LAST_UPDATED } from '@/lib/legal/company';

export const metadata: Metadata = buildPageMetadata({
  title: 'Accessibility statement — CadetMate',
  description:
    'How CadetMate aims to meet accessibility expectations for UK deck cadets using the web app, and how to report barriers.',
  path: '/accessibility',
  keywords: ['CadetMate accessibility', 'WCAG CadetMate', 'accessible maritime training'],
});

export default function AccessibilityPage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Accessibility', path: '/accessibility' },
        ])}
      />
      <LegalDocument
        eyebrow="CadetMate"
        title="Accessibility statement"
        intro="We want CadetMate to be usable by as many cadets as possible — including keyboard users, screen-reader users, and people who prefer reduced motion."
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <section>
          <h2>Our aim</h2>
          <p>
            We design the public site and learning app against WCAG 2.2 Level AA as a practical
            target: skip links to main content, visible focus states, labelled controls, semantic
            headings, and respect for <code>prefers-reduced-motion</code> on marketing motion.
          </p>
        </section>

        <section>
          <h2>What we currently support</h2>
          <ul>
            <li>Skip-to-content link on public and app shells</li>
            <li>Page language set to English (UK)</li>
            <li>Focus-visible rings on core buttons, inputs, and navigation</li>
            <li>Cookie and contact forms with associated labels</li>
            <li>Reduced-motion options for landing animations and page enter transitions</li>
          </ul>
        </section>

        <section>
          <h2>Known limitations</h2>
          <p>
            Some charts, module viewers, and admin tools are visually dense and may be harder to use
            with a screen reader or keyboard alone. Some progress indicators are still being improved. We treat accessibility as ongoing
            work, not a one-off certificate.
          </p>
        </section>

        <section>
          <h2>How to report a barrier</h2>
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{' '}
            <Link href="/contact">contact form</Link> with the page URL and what you were trying to
            do. We will do our best to provide the information another way (for example a text
            alternative) while we fix the issue.
          </p>
        </section>
      </LegalDocument>
    </>
  );
}
