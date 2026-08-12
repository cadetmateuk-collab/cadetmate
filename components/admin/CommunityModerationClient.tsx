'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Flag, Loader2, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { AdminBtn, AdminBadge, C } from '@/components/admin/ui';
import { AdminPanel, AdminStatCard } from '@/components/admin/AdminChrome';
import type { ModerationQueueItem } from '@/lib/community/types';

function formatCats(cats: unknown): string[] {
  if (Array.isArray(cats)) return cats.map(String);
  return [];
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function CommunityModerationClient() {
  const searchParams = useSearchParams();
  const focus = searchParams.get('focus');
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/moderation');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load queue');
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!focus || loading) return;
    const el = document.getElementById(`mod-${focus}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focus, loading, items]);

  const decide = async (item: ModerationQueueItem, action: 'approve' | 'remove') => {
    setBusyId(item.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: item.contentType,
          contentId: item.contentId,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const postCount = useMemo(() => items.filter((i) => i.contentType === 'post').length, [items]);
  const commentCount = useMemo(
    () => items.filter((i) => i.contentType === 'comment').length,
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Pending review" value={items.length} tone="warning" />
        <AdminStatCard label="Flagged posts" value={postCount} tone="danger" />
        <AdminStatCard label="Flagged comments" value={commentCount} tone="danger" />
      </div>

      <AdminPanel
        title="Flagged queue"
        description="Auto-moderation held these items. Approve to publish, or remove to delete."
        actions={
          <AdminBtn variant="ghost" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </AdminBtn>
        }
      >
        {error ? (
          <div
            className="mb-4 rounded-lg border px-3 py-2 text-sm"
            style={{ background: C.redLight, borderColor: 'hsl(var(--destructive) / 0.25)', color: C.red }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading flagged content…
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No flagged posts or comments right now.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const isFocus = focus === `${item.contentType}:${item.contentId}`;
              const cats = formatCats(item.log?.categories);
              const authorName =
                item.author?.full_name?.trim() ||
                item.author?.email?.split('@')[0] ||
                'Unknown user';

              return (
                <li
                  key={item.id}
                  id={`mod-${item.contentType}:${item.contentId}`}
                  className="rounded-xl border-2 p-4 transition-shadow"
                  style={{
                    borderColor: isFocus ? C.primary : 'hsl(var(--signal-amber) / 0.55)',
                    background: isFocus
                      ? 'rgba(245, 27, 78, 0.06)'
                      : 'hsl(var(--signal-amber-light))',
                    boxShadow: isFocus ? `0 0 0 3px rgba(245, 27, 78, 0.18)` : undefined,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminBadge variant="warning">
                        <Flag className="mr-1 inline h-3 w-3" />
                        Flagged {item.contentType}
                      </AdminBadge>
                      {cats.map((c) => (
                        <AdminBadge key={c} variant="danger">
                          {c}
                        </AdminBadge>
                      ))}
                      {item.log?.provider ? (
                        <AdminBadge variant="muted">{item.log.provider}</AdminBadge>
                      ) : null}
                      {typeof item.log?.toxicity_score === 'number' ? (
                        <AdminBadge variant="muted">
                          score {(item.log.toxicity_score * 100).toFixed(0)}%
                        </AdminBadge>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">
                      By <span className="font-medium text-foreground">{authorName}</span>
                      {item.author?.email ? ` · ${item.author.email}` : ''}
                    </p>
                    {item.title ? (
                      <h3 className="mt-1 text-base font-bold text-foreground">{item.title}</h3>
                    ) : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {item.body}
                    </p>
                    {item.log?.explanation ? (
                      <p
                        className="mt-3 rounded-md border px-3 py-2 text-xs"
                        style={{
                          background: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--signal-amber) / 0.35)',
                          color: C.mutedFg,
                        }}
                      >
                        Filter note: {item.log.explanation}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AdminBtn
                      variant="primary"
                      disabled={busyId === item.id}
                      onClick={() => void decide(item, 'approve')}
                    >
                      {busyId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Approve & publish
                    </AdminBtn>
                    <AdminBtn
                      variant="danger"
                      disabled={busyId === item.id}
                      onClick={() => void decide(item, 'remove')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </AdminBtn>
                    {item.contentType === 'post' || item.postId ? (
                      <a
                        href={
                          item.contentType === 'post'
                            ? `/community/post/${item.contentId}`
                            : `/community/post/${item.postId}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open in community
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
