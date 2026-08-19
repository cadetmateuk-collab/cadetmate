import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/get-user';
import { isPremiumRole } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { User, Sparkles, CreditCard, Bell, Settings, Crown, Shield, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PasswordResetButton } from '../settings/PasswordResetButton';
import { sendPasswordReset } from '../settings/send-password-reset';
import { SubscribeButton } from '@/components/billing/SubscribeButton';
import { BillingPortalButton } from '@/components/billing/BillingPortalButton';
import { NotificationPreferencesForm } from '@/components/profile/NotificationPreferencesForm';
import { UserAvatar } from '@/components/auth/onboarding/UserAvatar';
import { ProfileAvatarEditor } from '@/components/profile/ProfileAvatarEditor';
import { labelForPhase, labelsForInterests, labelForReferral } from '@/lib/onboarding/constants';

export const metadata: Metadata = buildPageMetadata({
  title: 'Profile',
  description: 'Manage your CadetMate account and subscription.',
  path: '/profile',
  noIndex: true,
});

const PROFILE_TABS = [
  { id: 'account', label: 'Account', icon: User, href: '/profile' },
  { id: 'subscription', label: 'Subscription', icon: Sparkles, href: '/profile?tab=subscription' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '/profile?tab=billing' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/profile?tab=notifications' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const user = await requireAuth();
  const supabase = await createClient();
  const role = user.profile?.role ?? 'free';
  const isPremium = isPremiumRole(role);

  const { data: communityProfile } = await supabase
    .from('community_user_profiles')
    .select('karma_score, post_count, comment_count')
    .eq('user_id', user.id)
    .maybeSingle();

  const roleBadge =
    role === 'admin' ? (
      <Badge className="bg-slate-100 text-slate-800 border-slate-200">
        <Shield className="h-3 w-3 mr-1" /> Admin
      </Badge>
    ) : role === 'content' ? (
      <Badge className="bg-sky-100 text-sky-800 border-sky-200">
        <Ship className="h-3 w-3 mr-1" /> Content
      </Badge>
    ) : role === 'premium' ? (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
        <Crown className="h-3 w-3 mr-1" /> Premium
      </Badge>
    ) : null;

  const avatarKind = user.profile?.avatar_kind === 'preset' ? 'preset' : 'initials';
  const avatarPreset = user.profile?.avatar_preset ?? null;
  const avatarColor =
    typeof user.profile?.avatar_color === 'string' ? user.profile.avatar_color : null;

  return (
    <div className="w-full py-2">
      <div className="mb-8 flex items-start gap-4 overflow-visible">
        <UserAvatar
          fullName={user.profile?.full_name ?? 'Cadet'}
          avatarKind={avatarKind}
          avatarPreset={avatarPreset}
          avatarColor={avatarColor}
          size={72}
          role={role}
          badgeScale={0.25}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{user.profile?.full_name ?? 'Cadet'}</h1>
            {roleBadge}
          </div>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          {communityProfile && (
            <p className="text-xs text-muted-foreground mt-1">
              {communityProfile.karma_score ?? 0} karma · {communityProfile.post_count ?? 0} posts ·{' '}
              {communityProfile.comment_count ?? 0} comments
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/community/user/${user.id}`}>Public Profile</Link>
        </Button>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border">
        {PROFILE_TABS.map((t) => {
          const Icon = t.icon;
          const active = (!tab && t.id === 'account') || tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {(!tab || tab === 'account') && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-6 space-y-4">
            <h2 className="font-semibold">Account Details</h2>

            <ProfileAvatarEditor
              fullName={user.profile?.full_name ?? 'Cadet'}
              avatarKind={avatarKind}
              avatarPreset={avatarPreset}
              avatarColor={avatarColor}
              role={role}
            />

            <div className="border-t border-border pt-4">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Full Name</p>
                  <p className="font-medium">{user.profile?.full_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Role</p>
                  <p className="font-medium capitalize">{user.profile?.role ?? 'free'}</p>
                </div>
                {user.profile?.training_phase && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Training phase</p>
                    <p className="font-medium">{labelForPhase(user.profile.training_phase)}</p>
                  </div>
                )}
                {user.profile?.nautical_college && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Nautical college</p>
                    <p className="font-medium">{user.profile.nautical_college}</p>
                  </div>
                )}
                {user.profile?.referral_source && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Heard about us</p>
                    <p className="font-medium">{labelForReferral(user.profile.referral_source)}</p>
                  </div>
                )}
                {Array.isArray(user.profile?.learning_interests) &&
                  user.profile.learning_interests.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Learning interests</p>
                      <p className="font-medium">
                        {labelsForInterests(user.profile.learning_interests).join(', ')}
                      </p>
                    </div>
                  )}
              </div>
            </div>
            <PasswordResetButton action={sendPasswordReset} />
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-semibold mb-2">Subscription</h2>
          {isPremium ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">Premium Active</p>
                  <p className="text-sm text-amber-700">You have full access to Premium training features.</p>
                </div>
              </div>
              <BillingPortalButton>Manage billing</BillingPortalButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to unlock modules, simulators, oral banks, and TRB tools. Flashcard packs are sold separately.
              </p>
              <div className="flex flex-wrap gap-3">
                <SubscribeButton />
                <Button variant="outline" asChild>
                  <Link href="/store">Open store</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'billing' && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-semibold mb-2">Billing</h2>
          <p className="text-sm text-muted-foreground">
            Update your payment method, view invoices, or cancel in the Stripe customer portal.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {isPremium ? (
              <BillingPortalButton>Open billing portal</BillingPortalButton>
            ) : (
              <SubscribeButton />
            )}
            <Button variant="outline" asChild>
              <Link href="/store">Go to Store</Link>
            </Button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-semibold mb-4">Notification Preferences</h2>
          <NotificationPreferencesForm userId={user.id} />
        </div>
      )}
    </div>
  );
}
