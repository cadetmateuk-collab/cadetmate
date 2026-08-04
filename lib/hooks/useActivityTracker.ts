'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useActivityTracker() {
  const sessionStartRef = useRef<Date | null>(null);
  const lastActivityUpdateRef = useRef<Date | null>(null);
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
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      lastActivityUpdateRef.current = new Date();
    };

    const trackActivity = async () => {
      if (!sessionStartRef.current) return;

      const sessionEnd = new Date();
      const durationSeconds = Math.floor(
        (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000,
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        session_start: sessionStartRef.current.toISOString(),
        session_end: sessionEnd.toISOString(),
        duration_seconds: durationSeconds,
        page_path: window.location.pathname,
      });

      await supabase.rpc('increment_user_time', {
        p_user_id: user.id,
        p_seconds: durationSeconds,
      });

      sessionStartRef.current = new Date();
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

    const trackInterval = setInterval(trackActivity, 5 * 60 * 1000);

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

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });

    const handleUnload = () => {
      void trackActivity();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      void trackActivity();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      clearInterval(trackInterval);
      clearInterval(activityInterval);
      if (interactionTimeout) clearTimeout(interactionTimeout);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (idleTimeout) clearTimeout(idleTimeout);
    };
  }, []);
}
