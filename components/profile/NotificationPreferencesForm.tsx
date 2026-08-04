'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Prefs = {
  email_product: boolean;
  email_community: boolean;
  email_marketing: boolean;
  in_app_xp: boolean;
  in_app_billing: boolean;
};

const DEFAULTS: Prefs = {
  email_product: true,
  email_community: true,
  email_marketing: false,
  in_app_xp: true,
  in_app_billing: true,
};

const FIELDS: { key: keyof Prefs; label: string; hint: string }[] = [
  {
    key: 'in_app_xp',
    label: 'In-app XP alerts',
    hint: 'Show notifications when you earn XP from study',
  },
  {
    key: 'in_app_billing',
    label: 'In-app billing alerts',
    hint: 'Premium unlocked, cancelled, and payment notices',
  },
  {
    key: 'email_product',
    label: 'Product emails',
    hint: 'Account and training updates (when email sending is configured)',
  },
  {
    key: 'email_community',
    label: 'Community emails',
    hint: 'Replies and mentions in community threads',
  },
  {
    key: 'email_marketing',
    label: 'Marketing emails',
    hint: 'Occasional tips and offers — off by default',
  },
];

export function NotificationPreferencesForm({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        setPrefs({
          email_product: data.email_product,
          email_community: data.email_community,
          email_marketing: data.email_marketing,
          in_app_xp: data.in_app_xp,
          in_app_billing: data.in_app_billing,
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  const update = async (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: userId,
      ...next,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setMessage(error ? error.message : 'Saved');
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading preferences…</p>;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Control in-app alerts and email categories. Use the bell icon in the header for your inbox.
      </p>
      {FIELDS.map((field) => (
        <div key={field.key} className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor={field.key}>{field.label}</Label>
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          </div>
          <Switch
            id={field.key}
            checked={prefs[field.key]}
            onCheckedChange={(checked) => update(field.key, checked)}
            disabled={saving}
          />
        </div>
      ))}
      {message && (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
