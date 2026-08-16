import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { ProgressStore } from './offline/ProgressStore';

const FLUSH_MS = 60_000;
const MIN_SECONDS = 15;

/** Counts time across the whole app, not only the module reader. */
export function StudyActivityTracker() {
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const flush = () => {
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      if (seconds < MIN_SECONDS) return;
      startedAt.current = Date.now();
      void ProgressStore.logActivity(seconds, 'app');
    };

    const interval = setInterval(flush, FLUSH_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') startedAt.current = Date.now();
      else flush();
    });

    return () => {
      flush();
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return null;
}
