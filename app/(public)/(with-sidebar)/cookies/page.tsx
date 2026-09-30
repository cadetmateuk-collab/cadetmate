import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/feature/seo/JsonLd';
import { LegalDocument } from '@/components/feature/legal/LegalDocument';
import {
  LEGAL_LAST_UPDATED,
  LEGAL_ENTITY_NAME,
  PRIVACY_CONTACT_EMAIL,
} from '@/lib/legal/company';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cookie Policy — CadetMate',
  description:
    'How CadetMate uses essential and optional cookies, including Google Analytics, and how to manage your preferences.',
  path: '/cookies',
  keywords: ['CadetMate cookie policy', 'CadetMate cookies', 'analytics consent'],
});

export default function CookiesPage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Cookie Policy', path: '/cookies' },
        ])}
      />
      <LegalDocument
        eyebrow="Legal"
        title="Cookie Policy"
        intro="This policy explains the cookies and similar technologies CadetMate uses on cadetmate.co.uk, and how you can control them."
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <section>
          <h2>1. What cookies are</h2>
          <p>
            Cookies are small text files stored on your device. We also use related storage such as
            localStorage for theme and cookie preferences. {LEGAL_ENTITY_NAME} is responsible for
            cookies set by CadetMate.
          </p>
        </section>

        <section>
          <h2>2. Essential cookies</h2>
          <p>These are required for the site to work. They do not require opt-in.</p>
          <ul>
            <li>
              <strong>Authentication (Supabase session)</strong> — keeps you signed in securely
            </li>
            <li>
              <strong>Cookie preference</strong> — remembers whether you allowed analytics
            </li>
            <li>
              <strong>Theme</strong> — remembers light or dark appearance if you change it
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Analytics cookies (optional)</h2>
          <p>
            If you click “Accept all” or enable Analytics in Cookie settings, we load Google
            Analytics (GA4). Google may set cookies such as <code>_ga</code> to measure visits. IP
            anonymisation is enabled in our configuration. If you reject non-essential cookies, we
            do not load Google Analytics.
          </p>
          <p>
            We also send a first-party page-view beacon to our own servers on public pages. That
            does not load Google tags. See the <Link href="/privacy">Privacy Policy</Link> for how
            usage data is handled.
          </p>
        </section>

        <section>
          <h2>4. How to manage cookies</h2>
          <ul>
            <li>Use Cookie settings in the site footer to accept, reject, or change analytics</li>
            <li>Use your browser controls to block or delete cookies</li>
            <li>
              Google Analytics opt-out browser add-ons are described on Google&apos;s support site
            </li>
          </ul>
          <p>
            Blocking essential cookies may stop sign-in from working. Questions:{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>.
          </p>
        </section>
      </LegalDocument>
    </>
  );
}
