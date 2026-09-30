import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/feature/seo/JsonLd';
import { LegalDocument } from '@/components/feature/legal/LegalDocument';
import { SUPPORT_EMAIL } from '@/lib/seo/site';
import {
  LEGAL_LAST_UPDATED,
  LEGAL_ENTITY_NAME,
  LEGAL_REGISTERED_ADDRESS,
  LEGAL_COMPANY_NUMBER,
  GOVERNING_LAW,
  PRIVACY_CONTACT_EMAIL,
} from '@/lib/legal/company';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy — CadetMate',
  description:
    'How CadetMate collects, uses, and stores personal data for UK deck cadet training accounts, payments, analytics, and support.',
  path: '/privacy',
  keywords: ['CadetMate privacy policy', 'deck cadet app data protection', 'CadetMate GDPR'],
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Privacy Policy', path: '/privacy' },
        ])}
      />
      <LegalDocument
        eyebrow="Legal"
        title="Privacy Policy"
        intro="This policy explains what personal data CadetMate collects when you use cadetmate.co.uk and related apps, why we use it, and the rights you have."
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <section>
          <h2>1. Who we are</h2>
          <p>
            CadetMate is a UK maritime training platform for aspiring and current merchant navy deck
            cadets. The data controller for this service is <strong>{LEGAL_ENTITY_NAME}</strong>.
          </p>
          <ul>
            <li>Registered address: {LEGAL_REGISTERED_ADDRESS}</li>
            <li>Company number: {LEGAL_COMPANY_NUMBER}</li>
            <li>
              Privacy questions: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>
            </li>
          </ul>
          <p>Governing law referenced in these templates: {GOVERNING_LAW}.</p>
        </section>

        <section>
          <h2>2. Data we collect</h2>
          <h3>Account information</h3>
          <p>
            When you create an account we collect your email address, password (stored as a hash by
            our authentication provider), display name, and optional profile details such as avatar,
            cadetship stage, and learning interests you choose during onboarding.
          </p>
          <h3>Payment information</h3>
          <p>
            Paid Premium subscriptions and store purchases are processed by Stripe. We receive
            limited billing metadata (for example customer ID, subscription status, and last four
            digits where provided). We do not store full card numbers on CadetMate servers.
          </p>
          <h3>Usage and progress</h3>
          <p>
            To provide an eLearning product we store module and lesson progress, quiz and oral
            practice results, flashcard revision history, study streaks, and similar learning
            activity so you can pick up where you left off.
          </p>
          <h3>Community and support</h3>
          <p>
            If you post in the community, your posts, comments, and votes are stored. Support
            messages (in-app tickets or the contact form) include your name, email, and message
            content.
          </p>
          <h3>Analytics</h3>
          <p>
            If you consent, we use Google Analytics to understand aggregate site usage. We also
            record first-party page-view beacons on public pages to improve the product. You can
            refuse analytics cookies — see our <Link href="/cookies">Cookie Policy</Link>.
          </p>
          <h3>Technical data</h3>
          <p>
            Like most websites, our hosting and security logs may include IP address, browser type,
            device, and request timestamps, used to operate, secure, and debug the service.
          </p>
        </section>

        <section>
          <h2>3. How we use your data</h2>
          <ul>
            <li>To create and authenticate your account and keep you signed in</li>
            <li>To deliver training content, progress tracking, and Premium features you have paid for</li>
            <li>To process payments, invoices, and refunds via Stripe</li>
            <li>To send transactional email (account, billing, and support replies)</li>
            <li>To respond to contact and support requests</li>
            <li>To moderate the community and keep it safe for cadets</li>
            <li>To measure and improve the platform (analytics only where you have consented)</li>
            <li>To meet legal, tax, and security obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal bases (UK GDPR)</h2>
          <p>Depending on the activity, we rely on:</p>
          <ul>
            <li>
              <strong>Contract</strong> — providing the account, paid access, and support you request
            </li>
            <li>
              <strong>Legitimate interests</strong> — securing the service, preventing abuse, and
              improving first-party product analytics that do not require non-essential cookies
            </li>
            <li>
              <strong>Consent</strong> — optional analytics cookies / Google Analytics
            </li>
            <li>
              <strong>Legal obligation</strong> — tax, accounting, and responding to lawful requests
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Third-party services</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — authentication, database, and file storage
            </li>
            <li>
              <strong>Stripe</strong> — payment processing and customer billing portal
            </li>
            <li>
              <strong>Email delivery (SMTP)</strong> — transactional and support email
            </li>
            <li>
              <strong>Google Analytics</strong> — optional, only after cookie consent
            </li>
          </ul>
          <p>
            Those providers process data on our instructions or as independent controllers for their
            own services (for example Stripe for card processing). Review their privacy notices as
            well.
          </p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            Essential cookies keep you logged in and remember cookie preferences and theme. Optional
            analytics cookies are described in the <Link href="/cookies">Cookie Policy</Link>. You
            can change your choice at any time via Cookie settings in the footer.
          </p>
        </section>

        <section>
          <h2>7. How long we keep data</h2>
          <p>
            Account and progress data are kept while your account is active. After you ask us to
            delete your account, we remove or anonymise personal data that is no longer needed,
            except records we must keep for legal, tax, or dispute reasons (for example billing
            history). Support emails and tickets are retained long enough to resolve your request
            and for a reasonable follow-up period.
          </p>
        </section>

        <section>
          <h2>8. Your rights</h2>
          <p>
            Under UK data protection law you can ask to access, correct, or delete your personal
            data, restrict or object to certain processing, and request a portable copy of data you
            provided. Where we rely on consent, you can withdraw it. To exercise these rights, email{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>. You can also
            complain to the Information Commissioner&apos;s Office (ICO).
          </p>
        </section>

        <section>
          <h2>9. Children</h2>
          <p>
            CadetMate is aimed at aspiring and current UK deck cadets. If you are under 16, you
            should only use the service with a parent or guardian&apos;s involvement. We do not
            knowingly collect personal data from younger children for marketing.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            Privacy questions: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>{' '}
            or the <Link href="/contact">contact form</Link>. General support:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </LegalDocument>
    </>
  );
}
