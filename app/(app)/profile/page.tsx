import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { User, Sparkles, CreditCard, Bell, Settings, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PasswordResetButton } from '../settings/PasswordResetButton';

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
  const isPremium = user.profile?.role === 'premium' || user.profile?.role === 'admin';

  const { data: communityProfile } = await supabase
    .from('community_user_profiles')
    .select('karma_score, post_count, comment_count')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-start gap-4 mb-8">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
          {(user.profile?.full_name ?? 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{user.profile?.full_name ?? 'Cadet'}</h1>
            {isPremium && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <Crown className="h-3 w-3 mr-1" /> Premium
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          {communityProfile && (
            <p className="text-xs text-muted-foreground mt-1">
              {communityProfile.karma_score ?? 0} karma · {communityProfile.post_count ?? 0} posts · {communityProfile.comment_count ?? 0} comments
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
          <div className="rounded-2xl border border-border/60 p-6 space-y-4">
            <h2 className="font-semibold">Account Details</h2>
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
            </div>
            <PasswordResetButton />
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="rounded-2xl border border-border/60 p-6">
          <h2 className="font-semibold mb-2">Subscription</h2>
          {isPremium ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Premium Active</p>
                <p className="text-sm text-amber-700">You have full access to all CadetMate features.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to unlock all modules, flashcards, simulators, and the full question bank.
              </p>
              <Button asChild>
                <Link href="/store">View Plans & Upgrade</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'billing' && (
        <div className="rounded-2xl border border-border/60 p-6">
          <h2 className="font-semibold mb-2">Billing</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and payment methods through the store.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/store">Go to Store</Link>
          </Button>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="rounded-2xl border border-border/60 p-6">
          <h2 className="font-semibold mb-2">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Use the bell icon in the header to view notifications. Email preferences coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
