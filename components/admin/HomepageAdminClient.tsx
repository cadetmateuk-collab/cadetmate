// @ts-nocheck
'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/AdminChrome';
import { AdminBtn, AdminInput, AdminTextarea } from '@/components/admin/ui';
import { logClientActivity } from '@/lib/activity/log-event-client';
import { ActivityActions } from '@/lib/activity/actions';

type Section = {
  id: string;
  key: string;
  title: string | null;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  visible: boolean;
};

export default function HomepageAdminClient() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order');
    if (err) {
      setError(err.message);
      setSections([]);
    } else {
      setSections((data as Section[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateLocal = (id: string, patch: Partial<Section>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const save = async (section: Section) => {
    const supabase = createClient();
    setSavingId(section.id);
    const { error: err } = await supabase
      .from('homepage_sections')
      .update({
        title: section.title,
        body: section.body,
        cta_label: section.cta_label,
        cta_href: section.cta_href,
        sort_order: section.sort_order,
        visible: section.visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', section.id);
    setSavingId(null);
    if (err) {
      alert(err.message);
      return;
    }
    void logClientActivity({
      action: ActivityActions.CONTENT_UPDATED,
      entityType: 'homepage_section',
      entityId: section.id,
      entityTitle: section.title || section.key,
      metadata: { key: section.key, visible: section.visible },
    });
  };

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Manage homepage sections, visibility, and CTAs. Live sections are marked clearly."
      />

      {loading ? <AdminLoadingState /> : null}
      {error ? (
        <AdminPanel>
          <AdminEmptyState
            title="Homepage CMS not ready"
            description={
              error.toLowerCase().includes('homepage_sections') ||
              error.toLowerCase().includes('relation')
                ? 'Apply supabase/migrations/20260809190000_admin_stats_and_homepage.sql to enable homepage section management.'
                : error
            }
          />
        </AdminPanel>
      ) : null}

      {!loading && !error && sections.length === 0 ? (
        <AdminEmptyState title="No homepage sections" description="Seed data will appear after migration." />
      ) : null}

      <div className="space-y-4">
        {sections.map((section) => (
          <AdminPanel
            key={section.id}
            title={section.title || section.key}
            description={`Key: ${section.key}`}
            actions={
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  section.visible
                    ? 'bg-[hsl(var(--starboard-light))] text-[hsl(var(--starboard))]'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {section.visible ? 'Live' : 'Hidden'}
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Title
                <AdminInput
                  value={section.title ?? ''}
                  onChange={(v) => updateLocal(section.id, { title: v })}
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Sort order
                <AdminInput
                  type="number"
                  value={String(section.sort_order)}
                  onChange={(v) => updateLocal(section.id, { sort_order: Number(v) || 0 })}
                />
              </label>
              <label className="sm:col-span-2 text-xs font-semibold text-muted-foreground">
                Body
                <AdminTextarea
                  value={section.body ?? ''}
                  onChange={(v) => updateLocal(section.id, { body: v })}
                  rows={3}
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                CTA label
                <AdminInput
                  value={section.cta_label ?? ''}
                  onChange={(v) => updateLocal(section.id, { cta_label: v || null })}
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                CTA href
                <AdminInput
                  value={section.cta_href ?? ''}
                  onChange={(v) => updateLocal(section.id, { cta_href: v || null })}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) => updateLocal(section.id, { visible: e.target.checked })}
                />
                Visible on homepage
              </label>
              <AdminBtn onClick={() => void save(section)} disabled={savingId === section.id}>
                {savingId === section.id ? 'Saving…' : 'Save section'}
              </AdminBtn>
            </div>
          </AdminPanel>
        ))}
      </div>
    </div>
  );
}
