'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/AdminChrome';
import { AdminInput, AdminSelect } from '@/components/admin/ui';

type LibraryItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  premium: boolean;
  updatedAt: string | null;
  href: string;
};

export default function ContentLibraryClient({ mode }: { mode: 'all' | 'drafts' | 'reviews' }) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [modules, blogs, packs, trb, sea] = await Promise.all([
          supabase.from('modules').select('id, title, hidden, is_premium, updated_at').limit(200),
          supabase.from('blog_posts').select('id, title, hidden, featured, date, slug').limit(200),
          supabase.from('flashcard_packs').select('id, title, status, is_premium, updated_at').limit(200),
          supabase.from('trb_tasks').select('id, title, code').limit(200),
          supabase.from('sea_survival').select('id, title, hidden, slug').limit(200),
        ]);

        const next: LibraryItem[] = [];

        for (const m of modules.data ?? []) {
          next.push({
            id: m.id,
            title: m.title,
            type: 'module',
            status: m.hidden ? 'hidden' : 'published',
            premium: Boolean(m.is_premium),
            updatedAt: m.updated_at,
            href: `/admin/modules`,
          });
        }
        for (const b of blogs.data ?? []) {
          next.push({
            id: b.id,
            title: b.title,
            type: 'free_content',
            status: b.hidden ? 'draft' : 'published',
            premium: false,
            updatedAt: b.date ?? null,
            href: `/admin/free-content`,
          });
        }
        for (const p of packs.data ?? []) {
          next.push({
            id: p.id,
            title: p.title,
            type: 'flashcard_pack',
            status: p.status ?? 'draft',
            premium: Boolean(p.is_premium),
            updatedAt: p.updated_at ?? null,
            href: `/admin/flashcards`,
          });
        }
        for (const t of trb.data ?? []) {
          next.push({
            id: t.id,
            title: t.title || t.code,
            type: 'trb_task',
            status: 'published',
            premium: true,
            updatedAt: null,
            href: `/admin/trb`,
          });
        }
        for (const s of sea.data ?? []) {
          next.push({
            id: s.id,
            title: s.title,
            type: 'sea_survival',
            status: s.hidden ? 'draft' : 'published',
            premium: true,
            updatedAt: null,
            href: `/admin/sea-survival`,
          });
        }

        if (!cancelled) setItems(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (mode === 'drafts' && !['draft', 'hidden', 'archived'].includes(item.status)) return false;
      if (mode === 'reviews' && !['draft', 'hidden'].includes(item.status)) return false;
      if (type !== 'all' && item.type !== type) return false;
      if (q.trim()) {
        const hay = `${item.title} ${item.type} ${item.status}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [items, mode, type, q]);

  const title =
    mode === 'drafts' ? 'Drafts' : mode === 'reviews' ? 'Publishing / Reviews' : 'Content Library';
  const description =
    mode === 'drafts'
      ? 'Unpublished and hidden content ready to continue editing.'
      : mode === 'reviews'
        ? 'Draft → Review → Approved → Published workflow. Items here need review or publishing.'
        : 'Searchable library across modules, free content, flashcards, TRB, and sea survival.';

  return (
    <div>
      <AdminPageHeader title={title} description={description} />

      <AdminPanel className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Search
            <AdminInput value={q} onChange={setQ} placeholder="Title, type, status…" />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Type
            <AdminSelect
              value={type}
              onChange={setType}
              options={[
                { label: 'All types', value: 'all' },
                { label: 'Modules', value: 'module' },
                { label: 'Free content', value: 'free_content' },
                { label: 'Flashcard packs', value: 'flashcard_pack' },
                { label: 'TRB tasks', value: 'trb_task' },
                { label: 'Sea survival', value: 'sea_survival' },
              ]}
            />
          </label>
        </div>
      </AdminPanel>

      {loading ? <AdminLoadingState /> : null}
      {error ? <AdminEmptyState title="Could not load library" description={error} /> : null}

      {!loading && !error && (
        <AdminPanel>
          {filtered.length === 0 ? (
            <AdminEmptyState title="No matching content" description="Try a different filter or create new content." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-2 font-bold">Title</th>
                    <th className="px-2 py-2 font-bold">Type</th>
                    <th className="px-2 py-2 font-bold">Status</th>
                    <th className="px-2 py-2 font-bold">Access</th>
                    <th className="px-2 py-2 font-bold">Updated</th>
                    <th className="px-2 py-2 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="border-b border-border/70 last:border-0">
                      <td className="px-2 py-2.5 font-medium text-foreground">{item.title}</td>
                      <td className="px-2 py-2.5 text-muted-foreground">{item.type}</td>
                      <td className="px-2 py-2.5">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {item.premium ? 'Premium' : 'Free'}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString('en-GB')
                          : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Link href={item.href} className="text-xs font-semibold text-primary hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      )}
    </div>
  );
}
