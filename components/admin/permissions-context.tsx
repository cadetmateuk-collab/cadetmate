'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  canDeleteContent,
  hasPermission,
  isAdminRole,
  isStaffRole,
  type Permission,
  type UserRole,
} from '@/lib/auth/roles';

type AdminPermissionsValue = {
  role: UserRole | null;
  loading: boolean;
  can: (permission: Permission) => boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isStaff: boolean;
};

const AdminPermissionsContext = createContext<AdminPermissionsValue | null>(null);

function useLoadRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        setLoading(false);
        return;
      }
      supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (cancelled) return;
          setRole((profile?.role as UserRole) ?? null);
          setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { role, loading };
}

function buildValue(role: UserRole | null, loading: boolean): AdminPermissionsValue {
  return {
    role,
    loading,
    can: (permission) => hasPermission(role, permission),
    canDelete: canDeleteContent(role),
    isAdmin: isAdminRole(role),
    isStaff: isStaffRole(role),
  };
}

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const { role, loading } = useLoadRole();
  const value = useMemo(() => buildValue(role, loading), [role, loading]);

  return (
    <AdminPermissionsContext.Provider value={value}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

/** Prefer context from AdminShell. Falls back to a one-shot role load if used alone. */
export function useAdminPermissions(): AdminPermissionsValue {
  const ctx = useContext(AdminPermissionsContext);
  // Only load when outside the provider — avoids N× profiles fetches per admin page.
  const needsStandalone = ctx === null;
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(needsStandalone);

  useEffect(() => {
    if (!needsStandalone) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        setLoading(false);
        return;
      }
      supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (cancelled) return;
          setRole((profile?.role as UserRole) ?? null);
          setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [needsStandalone]);

  const standaloneValue = useMemo(
    () => buildValue(role, loading),
    [role, loading],
  );

  return ctx ?? standaloneValue;
}

export function useCanDelete(): boolean {
  return useAdminPermissions().canDelete;
}
