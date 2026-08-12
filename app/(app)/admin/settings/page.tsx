import { requireAdminPagePermission } from '@/lib/admin/require-page';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/AdminChrome';
import Link from 'next/link';

const SECTIONS = [
  {
    id: 'general',
    title: 'General',
    description: 'Site name, public URLs, and product branding are configured via environment and SEO helpers.',
    href: null,
  },
  {
    id: 'billing',
    title: 'Premium / subscription',
    description: 'Stripe price IDs and premium entitlements are managed through environment variables and the Stripe webhook.',
    href: '/store',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'In-app notification preferences are per-user. Platform notification types are defined in the notifications schema.',
    href: null,
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Support ticket emails use SMTP_* environment variables. No additional admin form is exposed for credentials.',
    href: '/admin/support',
  },
  {
    id: 'homepage',
    title: 'Homepage',
    description: 'Edit homepage sections, CTAs, and visibility from the Homepage admin area.',
    href: '/admin/homepage',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Supabase, Stripe, and analytics collectors are configured in the deployment environment.',
    href: null,
  },
];

export default async function AdminSettingsPage() {
  await requireAdminPagePermission('settings.view');

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Structured settings for CadetMate. Only real configuration surfaces are shown — no fake toggles."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <AdminPanel key={section.id} title={section.title} description={section.description}>
            {section.href ? (
              <Link href={section.href} className="text-xs font-semibold text-primary hover:underline">
                Open related area →
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">Configured via environment / code — no runtime form.</p>
            )}
          </AdminPanel>
        ))}
      </div>
      <div className="mt-6">
        <AdminEmptyState
          title="Security note"
          description="Destructive system controls and secrets are never editable from this UI."
        />
      </div>
    </div>
  );
}
