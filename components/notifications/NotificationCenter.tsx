'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEscapeKey } from '@/lib/a11y/useEscapeKey';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const loadNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    setNotifications((data as Notification[]) ?? []);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEscapeKey(open, () => {
    setOpen(false);
    buttonRef.current?.focus();
  });

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  };

  const handleClick = async (n: Notification) => {
    const supabase = createClient();
    if (!n.read_at) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    }
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={!userId}
        className="relative h-11 w-11 min-h-11 min-w-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center" aria-hidden>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && userId && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Dismiss notifications"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-1.5rem))] sm:w-96 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[min(70dvh,28rem)] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold" id="notifications-heading">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-primary flex items-center gap-1 min-h-11 px-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                >
                  <Check className="h-3 w-3" aria-hidden /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-sm text-center text-muted-foreground">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                      !n.read_at && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.read_at && 'font-semibold')}>{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      {n.href && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
