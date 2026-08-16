'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { londonDateKey } from '@/lib/study/time';

const FLUSH_INTERVAL_MS = 60 * 1000;
const MIN_FLUSH_SECONDS = 15;

export function useActivityTracker() {
  const sessionStartRef = useRef<Date | null>(null);
  const lastActivityUpdateRef = useRef<Date | null>(null);
  const flushingRef = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    sessionStartRef.current = new Date();
    lastActivityUpdateRef.current = new Date();

    const updateLastActivity = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_statistics')
        .update({
          last_activity_at: new Date().toISOString(),
          last_activity_date: londonDateKey(),
        })
        .eq('user_id', user.id);

      lastActivityUpdateRef.current = new Date();
    };

    const trackActivity = async (force = false) => {
      if (flushingRef.current || !sessionStartRef.current) return;

      const sessionEnd = new Date();
      const durationSeconds = Math.floor(
        (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000,
      );
      if (!force && durationSeconds < MIN_FLUSH_SECONDS) return;

      flushingRef.current = true;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        if (durationSeconds >= MIN_FLUSH_SECONDS) {
          const { error } = await supabase.from('user_activity_log').insert({
            user_id: user.id,
            session_start: sessionStartRef.current.toISOString(),
            session_end: sessionEnd.toISOString(),
            duration_seconds: durationSeconds,
            page_path: window.location.pathname,
          });
          if (error) return;

          await supabase.rpc('increment_user_time', {
            p_user_id: user.id,
            p_seconds: durationSeconds,
          });
          sessionStartRef.current = new Date();
        }
      } finally {
        flushingRef.current = false;
      }
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let idleTimeout: ReturnType<typeof setTimeout> | undefined;
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(() => {
        void updateLastActivity();
      }, { timeout: 5000 });
    } else {
      idleTimeout = setTimeout(() => {
        void updateLastActivity();
      }, 2000);
    }

    const trackInterval = setInterval(() => {
      void trackActivity();
    }, FLUSH_INTERVAL_MS);

    const activityInterval = setInterval(() => {
      const timeSinceLastUpdate = lastActivityUpdateRef.current
        ? (Date.now() - lastActivityUpdateRef.current.getTime()) / 1000
        : Infinity;

      if (timeSinceLastUpdate >= 120) {
        void updateLastActivity();
      }
    }, 3 * 60 * 1000);

    let interactionTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleInteraction = () => {
      if (interactionTimeout) return;
      interactionTimeout = setTimeout(() => {
        void updateLastActivity();
        interactionTimeout = null;
      }, 60_000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void trackActivity(true);
      } else if (!sessionStartRef.current) {
        sessionStartRef.current = new Date();
      }
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    const handleUnload = () => {
      void trackActivity(true);
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      void trackActivity(true);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(trackInterval);
      clearInterval(activityInterval);
      if (interactionTimeout) clearTimeout(interactionTimeout);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (idleTimeout) clearTimeout(idleTimeout);
    };
  }, []);
}
