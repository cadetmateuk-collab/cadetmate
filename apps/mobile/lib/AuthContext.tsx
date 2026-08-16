import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { isPremiumRole } from '@cadet-mate/shared';
import { normalizeAvatarKind, type AvatarKind } from './avatar';
import { supabase } from './supabase';
import { ConnectivityManager } from './offline/ConnectivityManager';
import { LicenceManager } from './offline/LicenceManager';
import { kvGet, kvSet } from './offline/db';
import { isOfflineModeError } from './offline/errors';

function tokensFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(hash || query);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export type CadetProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  onboarding_completed: boolean | null;
  avatar_kind: AvatarKind;
  avatar_preset: string | null;
  avatar_color: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: CadetProfile | null;
  loading: boolean;
  isPremium: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  onboarding_completed: boolean | null;
  avatar_kind?: string | null;
  avatar_preset?: string | null;
  avatar_color?: string | null;
};

function metadataAvatar(user: User | null | undefined) {
  const meta = (user?.user_metadata ?? {}) as {
    avatar_kind?: string;
    avatar_preset?: string | null;
    avatar_color?: string | null;
  };
  return meta;
}

function toCadetProfile(row: ProfileRow, user?: User | null): CadetProfile {
  const meta = metadataAvatar(user);
  const kind = normalizeAvatarKind(row.avatar_kind || meta.avatar_kind);
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    onboarding_completed: row.onboarding_completed,
    avatar_kind: kind,
    avatar_preset:
      kind === 'preset' ? (row.avatar_preset ?? meta.avatar_preset ?? null) : null,
    avatar_color: row.avatar_color ?? meta.avatar_color ?? null,
  };
}

async function loadProfile(user: User): Promise<CadetProfile | null> {
  await ConnectivityManager.hydrate();
  const cacheKey = `profile:${user.id}`;
  if (!ConnectivityManager.canUseNetwork()) {
    const cached = await kvGet(cacheKey);
    return cached ? (JSON.parse(cached) as CadetProfile) : null;
  }
  try {
    const full =
      'id, full_name, email, role, onboarding_completed, avatar_kind, avatar_preset, avatar_color';
    const { data, error } = await supabase.from('profiles').select(full).eq('id', user.id).maybeSingle();
    const profile = !error && data
      ? toCadetProfile(data as ProfileRow, user)
      : await (async () => {
          const { data: fallback } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, onboarding_completed, avatar_kind, avatar_preset')
            .eq('id', user.id)
            .maybeSingle();
          return fallback ? toCadetProfile(fallback as ProfileRow, user) : null;
        })();
    if (profile) await kvSet(cacheKey, JSON.stringify(profile));
    return profile;
  } catch (err) {
    if (!isOfflineModeError(err)) throw err;
    const cached = await kvGet(cacheKey);
    return cached ? (JSON.parse(cached) as CadetProfile) : null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CadetProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [licencePremium, setLicencePremium] = useState(false);

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession();
    const next = data.session ?? null;
    setSession(next);
    if (!next?.user.id) {
      setProfile(null);
      return;
    }
    setProfile(await loadProfile(next.user));
    setLicencePremium(await LicenceManager.hasPremium());
  };

  useEffect(() => {
    let cancelled = false;

    const applyUrlSession = async (url: string) => {
      const tokens = tokensFromUrl(url);
      if (!tokens) return;
      await supabase.auth.setSession(tokens);
    };

    void (async () => {
      try {
        await ConnectivityManager.hydrate();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const next = data.session;
        setSession(next);
        if (next?.user) {
          try {
            setProfile(await loadProfile(next.user));
            setLicencePremium(await LicenceManager.hasPremium());
          } catch {
            /* Keep the session even if profile/SQLite is unavailable. */
          }
        }
      } catch {
        setSession(null);
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        void loadProfile(next.user)
          .then(setProfile)
          .catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    });
    void Linking.getInitialURL().then((url) => {
      if (url) void applyUrlSession(url);
    });
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      void applyUrlSession(url);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      isPremium: licencePremium || isPremiumRole(profile?.role),
      refreshProfile,
      async signIn(email, password) {
        try {
          await ConnectivityManager.hydrate();
          if (!ConnectivityManager.canUseNetwork()) {
            await ConnectivityManager.setOfflineMode(false);
          }
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return error.message;
          if (data.session) {
            setSession(data.session);
            if (data.user) {
              try {
                setProfile(await loadProfile(data.user));
                setLicencePremium(await LicenceManager.hasPremium());
              } catch {
                /* Session is enough to enter the app. */
              }
            }
          }
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : 'Could not sign in';
        }
      },
      async signUp(email, password, fullName) {
        try {
          await ConnectivityManager.hydrate();
          if (!ConnectivityManager.canUseNetwork()) {
            await ConnectivityManager.setOfflineMode(false);
          }
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });
          return error?.message ?? null;
        } catch (err) {
          return err instanceof Error ? err.message : 'Could not create account';
        }
      },
      async signOut() {
        try {
          await supabase.auth.signOut();
        } catch {
          /* Offline Mode still clears local session below */
        }
        setSession(null);
        setProfile(null);
        setLicencePremium(false);
      },
      async resetPassword(email) {
        try {
          await ConnectivityManager.hydrate();
          if (!ConnectivityManager.canUseNetwork()) {
            return 'Turn Offline Mode off to reset your password.';
          }
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: Linking.createURL('reset-password'),
          });
          return error?.message ?? null;
        } catch (err) {
          return err instanceof Error ? err.message : 'Could not send reset email';
        }
      },
    }),
    [session, profile, loading, licencePremium],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
