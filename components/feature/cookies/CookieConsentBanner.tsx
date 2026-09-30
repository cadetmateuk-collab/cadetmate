'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  openCookiePreferences,
  readConsent,
  writeConsent,
} from '@/lib/cookies/consent';

type Panel = 'banner' | 'manage' | 'hidden';

export function CookieConsentBanner() {
  const [panel, setPanel] = useState<Panel>('hidden');
  const [analytics, setAnalytics] = useState(false);
  const analyticsId = useId();

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setPanel('hidden');
    } else {
      setPanel('banner');
    }

    const open = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setPanel('manage');
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  function acceptAll() {
    writeConsent(true);
    setAnalytics(true);
    setPanel('hidden');
  }

  function rejectNonEssential() {
    writeConsent(false);
    setAnalytics(false);
    setPanel('hidden');
  }

  function savePreferences() {
    writeConsent(analytics);
    setPanel('hidden');
  }

  if (panel === 'hidden') return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-border bg-background shadow-nav p-5 sm:p-6">
        <h2 id="cookie-consent-title" className="text-base font-semibold">
          Cookies on CadetMate
        </h2>
        <p id="cookie-consent-desc" className="text-sm text-muted-foreground mt-2 leading-relaxed">
          We use essential cookies to keep you signed in and remember your theme. Optional
          analytics cookies (Google Analytics) help us understand how the site is used — only if
          you allow them.{' '}
          <Link href="/cookies" className="text-primary hover:underline">
            Cookie Policy
          </Link>
        </p>

        {panel === 'manage' ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Essential</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign-in, security, and cookie preference. Always on.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground shrink-0 mt-1">Always on</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor={analyticsId} className="text-sm font-medium">
                  Analytics
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Google Analytics to measure visits. Off unless you opt in.
                </p>
              </div>
              <Switch
                id={analyticsId}
                checked={analytics}
                onCheckedChange={setAnalytics}
                aria-label="Allow analytics cookies"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
          {panel === 'banner' ? (
            <>
              <Button type="button" variant="ghost" onClick={() => setPanel('manage')}>
                Manage preferences
              </Button>
              <Button type="button" variant="outline" onClick={rejectNonEssential}>
                Reject non-essential
              </Button>
              <Button type="button" onClick={acceptAll}>
                Accept all
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={rejectNonEssential}>
                Reject non-essential
              </Button>
              <Button type="button" variant="outline" onClick={acceptAll}>
                Accept all
              </Button>
              <Button type="button" onClick={savePreferences}>
                Save preferences
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Footer control to reopen cookie preferences. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => openCookiePreferences()} className={className}>
      Cookie settings
    </button>
  );
}
