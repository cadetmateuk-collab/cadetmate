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
} from '@/lib/legal/company';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Use — CadetMate',
  description:
    'Terms of Use for CadetMate: account eligibility, acceptable use, course access, payments, cancellation, and intellectual property.',
  path: '/terms',
  keywords: ['CadetMate terms of use', 'CadetMate terms of service', 'deck cadet training terms'],
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Terms of Use', path: '/terms' },
        ])}
      />
      <LegalDocument
        eyebrow="Legal"
        title="Terms of Use"
        intro="These terms govern your use of CadetMate, including the website, mobile apps, free content, Premium subscription, and store purchases."
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <section>
          <h2>1. Who these terms are with</h2>
          <p>
            You are contracting with <strong>{LEGAL_ENTITY_NAME}</strong> (CadetMate), registered at{' '}
            {LEGAL_REGISTERED_ADDRESS} (company number {LEGAL_COMPANY_NUMBER}). Contact:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>2. Account eligibility</h2>
          <p>
            CadetMate is built for aspiring and current UK merchant navy deck cadets and related
            learners. You must provide accurate account details and keep your login confidential.
            If you are under 16, a parent or guardian should supervise your use of the service.
          </p>
        </section>

        <section>
          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Share your paid account or scrape, copy, or redistribute Premium course materials</li>
            <li>Harass other cadets, post unlawful content, or attempt to compromise the platform</li>
            <li>Present CadetMate content as an official MCA, college, or shipping-company document</li>
            <li>Use the community for spam, advertising, or exam cheating services</li>
          </ul>
          <p>We may suspend or close accounts that breach these terms.</p>
        </section>

        <section>
          <h2>4. Course access and licensing</h2>
          <p>
            Free guides and the free account features are provided for your personal study. Premium
            modules, oral banks, and other paid tools are licensed to you for personal,
            non-commercial training use while your subscription (or applicable purchase) is active.
            You do not acquire ownership of CadetMate content, software, or trademarks.
          </p>
          <p>
            CadetMate is a study companion. It is not a substitute for approved training providers,
            sea service, or MCA examinations, and it is not an MCA-endorsed qualification.
          </p>
        </section>

        <section>
          <h2>5. Payment and subscriptions</h2>
          <p>
            Premium is billed through Stripe at the price shown at checkout. Flashcard packs and
            other store items may be one-off purchases. Prices are in GBP unless stated otherwise.
            You authorise recurring charges for subscriptions until you cancel.
          </p>
          <p>
            Cancellation, cooling-off, and refunds are described in the{' '}
            <Link href="/refunds">Refund Policy</Link>.
          </p>
        </section>

        <section>
          <h2>6. Cancellation</h2>
          <p>
            You can cancel a Premium subscription via the billing portal in your account (or by
            contacting support). Cancellation stops future renewals. Access typically continues
            until the end of the paid period unless a refund is agreed under the Refund Policy.
          </p>
        </section>

        <section>
          <h2>7. Intellectual property</h2>
          <p>
            CadetMate, the captain mascot, modules, articles, question banks, and software are owned
            by us or our licensors. Community posts remain yours; you grant us a licence to display
            them on the platform so other cadets can learn from the discussion.
          </p>
        </section>

        <section>
          <h2>8. Availability and changes</h2>
          <p>
            We aim for reliable access but do not guarantee uninterrupted service. We may update
            content, features, and these terms. Material changes will be posted on this page with a
            new “last updated” date.
          </p>
        </section>

        <section>
          <h2>9. Limitation of liability</h2>
          <p>
            CadetMate is provided for educational support. We are not liable for exam outcomes, sea
            service decisions, or operational incidents at sea. Nothing in these terms excludes
            liability that cannot be limited under the law of {GOVERNING_LAW}, including death or
            personal injury caused by negligence, or fraud.
          </p>
          <p>
            To the extent permitted by law, our total liability arising from your use of the paid
            service is limited to the fees you paid us in the 12 months before the claim.
          </p>
        </section>

        <section>
          <h2>10. Governing law</h2>
          <p>
            These terms are governed by the laws of {GOVERNING_LAW}. Courts of {GOVERNING_LAW} have
            exclusive jurisdiction, without affecting any mandatory consumer rights you have in your
            country of residence.
          </p>
        </section>

        <section>
          <h2>11. Related policies</h2>
          <ul>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/cookies">Cookie Policy</Link>
            </li>
            <li>
              <Link href="/refunds">Refund Policy</Link>
            </li>
            <li>
              <Link href="/accessibility">Accessibility statement</Link>
            </li>
          </ul>
        </section>
      </LegalDocument>
    </>
  );
}
