import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/feature/seo/JsonLd';
import { LegalDocument } from '@/components/feature/legal/LegalDocument';
import { SUPPORT_EMAIL } from '@/lib/seo/site';
import { LEGAL_LAST_UPDATED, REFUND_WINDOW_DAYS } from '@/lib/legal/company';

export const metadata: Metadata = buildPageMetadata({
  title: 'Refund Policy — CadetMate',
  description:
    'When CadetMate refunds Premium subscriptions and store purchases, how to cancel, and how to request a refund.',
  path: '/refunds',
  keywords: ['CadetMate refund policy', 'CadetMate cancellation', 'Premium subscription refund'],
});

export default function RefundsPage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Refund Policy', path: '/refunds' },
        ])}
      />
      <LegalDocument
        eyebrow="Legal"
        title="Refund and cancellation policy"
        intro="This policy covers CadetMate Premium subscriptions and one-off store purchases such as flashcard packs. Free accounts have no charge to refund."
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <section>
          <h2>1. Cooling-off period</h2>
          <p>
            If you buy Premium or a paid store item as a consumer, you may request a refund within{' '}
            <strong>{REFUND_WINDOW_DAYS} days</strong> of purchase, provided you have not
            substantially used the paid digital content (for example completing a large share of
            Premium modules, or extensively using a paid flashcard pack).
          </p>
          <p>
            FLAG: Confirm this window and the “substantial use” rule with a legal professional and
            against your Stripe refund settings before publishing.
          </p>
        </section>

        <section>
          <h2>2. Subscriptions</h2>
          <p>
            Cancel renewal at any time from your account billing portal (Profile → Billing) or by
            emailing <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Cancellation stops the
            next renewal. Unless a refund is approved, you keep Premium until the end of the period
            you already paid for.
          </p>
        </section>

        <section>
          <h2>3. When refunds are usually not available</h2>
          <ul>
            <li>After the cooling-off window, if the content has been substantially accessed</li>
            <li>For dissatisfaction with exam results — CadetMate is a study aid, not a guarantee</li>
            <li>Where the purchase was made in error after significant use of the paid material</li>
          </ul>
          <p>
            We may still issue a goodwill refund in exceptional cases (for example a genuine
            technical fault that prevented access).
          </p>
        </section>

        <section>
          <h2>4. How to request a refund</h2>
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{' '}
            <Link href="/contact">contact form</Link> with your account email and order or Stripe
            receipt ID. Approved refunds are returned to the original payment method via Stripe.
            Processing times depend on your bank or card issuer.
          </p>
        </section>

        <section>
          <h2>5. Chargebacks</h2>
          <p>
            Please contact us before raising a dispute with your bank so we can help faster. Fraud
            or abuse of refunds may lead to account suspension.
          </p>
        </section>
      </LegalDocument>
    </>
  );
}
