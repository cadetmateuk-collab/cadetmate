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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update last_activity_at timestamp
      await supabase
        .from('user_statistics')
        .update({ 
          last_activity_at: new Date().toISOString(),
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);
      
      lastActivityUpdateRef.current = new Date();
    };

    const trackActivity = async () => {
      if (!sessionStartRef.current) return;

      const sessionEnd = new Date();
      const durationSeconds = Math.floor(
        (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log session
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        session_start: sessionStartRef.current.toISOString(),
        session_end: sessionEnd.toISOString(),
        duration_seconds: durationSeconds,
        page_path: window.location.pathname,
      });

      // Update total time in statistics
      await supabase.rpc('increment_user_time', {
        p_user_id: user.id,
        p_seconds: durationSeconds
      });

      // Reset session start for next tracking period
      sessionStartRef.current = new Date();
    };

    // Update activity on mount
    updateLastActivity();

    // Track activity every 5 minutes for long sessions
    const trackInterval = setInterval(trackActivity, 5 * 60 * 1000);

    // Update last_activity_at every 1 minute (for active user tracking)
    const activityInterval = setInterval(() => {
      const timeSinceLastUpdate = lastActivityUpdateRef.current 
        ? (new Date().getTime() - lastActivityUpdateRef.current.getTime()) / 1000
        : Infinity;
      
      // Only update if there's been at least 30 seconds since last update
      // This prevents too many database calls
      if (timeSinceLastUpdate >= 30) {
        updateLastActivity();
      }
    }, 60 * 1000); // Check every minute

    // Update on user interaction (throttled)
    let interactionTimeout: NodeJS.Timeout | null = null;
    const handleInteraction = () => {
      if (interactionTimeout) return; // Already scheduled
      
      interactionTimeout = setTimeout(() => {
        updateLastActivity();
        interactionTimeout = null;
      }, 30000); // Throttle to max once per 30 seconds
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keypress', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    // Track on page unload
    const handleUnload = () => {
      trackActivity();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      trackActivity();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      clearInterval(trackInterval);
      clearInterval(activityInterval);
      if (interactionTimeout) clearTimeout(interactionTimeout);
    };
  }, []);
}