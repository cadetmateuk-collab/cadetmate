'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Users, RefreshCw, ChevronDown } from 'lucide-react';
import { adminColors } from '@/components/admin/ui';

type UserRole = 'free' | 'basic' | 'premium';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole | null;
  created_at: string | null;
  last_seen_at: string | null;
}

const ROLE_OPTIONS: UserRole[] = ['free', 'basic', 'premium'];

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  free:    { bg: 'hsl(var(--muted))',          color: 'hsl(var(--muted-foreground))' },
  basic:   { bg: 'hsl(38 90% 52% / 0.12)',     color: 'hsl(38 90% 42%)' },
  premium: { bg: 'hsl(var(--primary) / 0.1)',  color: 'hsl(var(--primary))' },
  admin:   { bg: 'hsl(280 55% 55% / 0.12)',    color: 'hsl(280 55% 45%)' },
};

function getRoleStyle(role: string | null) {
  return ROLE_STYLES[role ?? 'free'] ?? ROLE_STYLES['free'];
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RoleBadge({ role }: { role: UserRole | null }) {
  const r = role ?? 'free';
  const s = getRoleStyle(r);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      {r}
    </span>
  );
}

// ── Role selector dropdown ────────────────────────────────────────────────────
function RoleSelector({
  userId,
  currentRole,
  onUpdate,
}: {
  userId: string;
  currentRole: UserRole | null;
  onUpdate: (id: string, role: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSelect = async (role: UserRole) => {
    setOpen(false);
    if (role === (currentRole ?? 'free')) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    setSaving(false);
    if (!error) onUpdate(userId, role);
  };

  const r = currentRole ?? 'free';
  const s = getRoleStyle(r);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '999px',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          background: s.bg, color: s.color,
          border: `1px solid ${s.color}33`,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1,
          transition: 'opacity 0.15s',
          fontFamily: 'inherit',
        }}
      >
        {saving ? '…' : r}
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '10px', overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            minWidth: '110px',
          }}>
            {ROLE_OPTIONS.map(opt => {
              const os = getRoleStyle(opt);
              const isActive = opt === r;
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 12px',
                    background: isActive ? 'hsl(var(--muted))' : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: os.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </span>
                  {isActive && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function AdminUsersTab() {
  const supabase = createClient();
  const [users, setUsers]           = useState<Profile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, last_seen_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) setError(error.message);
    else setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleUpdate = (id: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    showToast(`Role updated to ${role}`, 'success');
  };

  const filtered = users.filter(u => {
    const matchSearch =
      (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || (u.role ?? 'free') === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    all:     users.length,
    free:    users.filter(u => (u.role ?? 'free') === 'free').length,
    basic:   users.filter(u => u.role === 'basic').length,
    premium: users.filter(u => u.role === 'premium').length,
  };

  const C = {
    bg: adminColors.bg,
    border: adminColors.border,
    muted: 'hsl(var(--muted))',
    mutedFg: adminColors.muted,
    fg: adminColors.fg,
    primary: adminColors.primary,
    red: adminColors.danger,
    green: adminColors.success,
  };

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 50,
          padding: '10px 18px', borderRadius: '10px',
          background: toast.type === 'success' ? C.green : C.red,
          color: 'white', fontSize: '13px', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.1)', display: 'flex' }}>
            <Users size={16} color={C.primary} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: C.fg }}>Users</h2>
            <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>{users.length} total</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          title="Refresh"
          style={{
            padding: '7px', borderRadius: '8px', border: 'none',
            background: 'transparent', cursor: 'pointer', color: C.mutedFg,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.muted}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {([
          { label: 'Total',   value: counts.all,     color: C.fg },
          { label: 'Free',    value: counts.free,    color: C.mutedFg },
          { label: 'Basic',   value: counts.basic,   color: 'hsl(38 90% 42%)' },
          { label: 'Premium', value: counts.premium, color: C.primary },
        ] as const).map(s => (
          <div key={s.label} style={{
            padding: '14px 16px', borderRadius: '12px',
            border: `1px solid ${C.border}`, background: C.bg,
          }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.mutedFg, margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + role filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.mutedFg }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px 8px 30px',
              borderRadius: '8px', fontSize: '12px',
              border: `1px solid ${C.border}`, background: C.bg,
              color: C.fg, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.primary}
            onBlur={e => e.currentTarget.style.borderColor = C.border}
          />
        </div>

        {/* Role filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['all', ...ROLE_OPTIONS] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              style={{
                padding: '6px 12px', borderRadius: '999px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                border: `1px solid ${filterRole === r ? C.primary : C.border}`,
                background: filterRole === r ? C.primary : 'transparent',
                color: filterRole === r ? 'white' : C.mutedFg,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: `2px solid ${C.border}`, borderTopColor: C.primary,
            animation: 'spin 0.75s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <p style={{ textAlign: 'center', color: C.red, fontSize: '13px', padding: '32px 0' }}>{error}</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.mutedFg }}>
          <Users size={32} color={C.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px' }}>No users found.</p>
        </div>
      ) : (
        <div style={{ borderRadius: '12px', border: `1px solid ${C.border}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 640, fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: `hsl(var(--muted) / 0.5)` }}>
                {['User', 'Email', 'Joined', 'Last Seen', 'Role'].map(h => (
                  <th key={h} style={{
                    textAlign: h === 'Role' ? 'center' : 'left',
                    padding: '10px 14px', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase', color: C.mutedFg,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: C.bg, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `hsl(var(--muted) / 0.4)`}
                  onMouseLeave={e => e.currentTarget.style.background = C.bg}
                >
                  {/* User */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Avatar initials */}
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                        background: 'hsl(var(--primary) / 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: C.primary,
                      }}>
                        {(user.full_name ?? user.email ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: C.fg }}>
                        {user.full_name ?? <span style={{ color: C.mutedFg, fontStyle: 'italic' }}>No name</span>}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '12px 14px', color: C.mutedFg }}>
                    {user.email ?? '—'}
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '12px 14px', color: C.mutedFg }}>
                    {formatDate(user.created_at)}
                  </td>

                  {/* Last seen */}
                  <td style={{ padding: '12px 14px', color: C.mutedFg }}>
                    {formatDate(user.last_seen_at)}
                  </td>

                  {/* Role */}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {user.role === 'admin' ? (
                      <RoleBadge role={user.role} />
                    ) : (
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        onUpdate={handleRoleUpdate}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}