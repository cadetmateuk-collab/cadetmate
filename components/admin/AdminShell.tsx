'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AdminPermissionsProvider,
  useAdminPermissions,
} from '@/components/admin/permissions-context';
import { filterAdminNav, type AdminNavItem } from '@/lib/admin/nav';
import { CadetMateLogo } from '@/components/brand/CadetMateLogo';
import { PageContainer } from '@/components/layout/PageContainer';

const SIDEBAR_WIDTH = 260;

/** Admin palette */
const P = {
  ink: '#242423',
  inkSoft: '#333533',
  sage: '#cfdbd5',
  paper: '#e8eddf',
  yellow: '#f5cb5c',
} as const;

function isItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== '/admin/dashboard' && pathname.startsWith(href + '/')) return true;
  return false;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
        active ? 'font-semibold shadow-sm' : 'hover:bg-[#333533]',
      )}
      style={
        active
          ? { backgroundColor: P.yellow, color: P.ink }
          : { color: '#ffffff' }
      }
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.color = P.yellow;
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.color = '#ffffff';
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color: 'inherit' }} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '';
  const { can, role, isAdmin, loading } = useAdminPermissions();
  const groups = useMemo(() => filterAdminNav(can), [can]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
        backgroundColor: P.ink,
        color: P.paper,
      }}
    >
      <div
        style={{
          display: 'flex',
          height: 56,
          flexShrink: 0,
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          borderBottom: `1px solid ${P.inkSoft}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            height: 32,
            width: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            backgroundColor: P.yellow,
          }}
        >
          <Shield className="h-4 w-4" style={{ color: P.ink }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="truncate"
            style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}
          >
            CadetMate Admin
          </div>
          <div
            className="truncate capitalize"
            style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}
          >
            {loading ? '…' : role ?? 'staff'}
          </div>
        </div>
        {onNavigate ? (
          <button
            type="button"
            className="rounded-md p-1.5 lg:hidden"
            style={{ color: P.sage }}
            onClick={onNavigate}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 12px',
        }}
      >
        {groups.map((group) => (
          <div key={group.id} style={{ marginBottom: 20 }}>
            <div
              style={{
                marginBottom: 6,
                padding: '0 12px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: P.sage,
              }}
            >
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  item={item}
                  active={isItemActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div
        style={{
          flexShrink: 0,
          padding: 12,
          borderTop: `1px solid ${P.inkSoft}`,
        }}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#333533] hover:text-[#f5cb5c]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to app
        </Link>
        <div style={{ marginTop: 8, padding: '0 12px' }}>
          <CadetMateLogo size="sm" showWordmark={false} />
        </div>
        {!isAdmin && (
          <p
            style={{
              marginTop: 8,
              padding: '0 12px',
              fontSize: 11,
              lineHeight: 1.45,
              color: P.sage,
            }}
          >
            Content role — create and edit only. Deletion and platform tools are restricted.
          </p>
        )}
      </div>
    </div>
  );
}

function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname() ?? '';
  const { can } = useAdminPermissions();
  const groups = useMemo(() => filterAdminNav(can), [can]);

  const current = useMemo(() => {
    for (const g of groups) {
      for (const item of g.items) {
        if (isItemActive(pathname, item.href)) {
          return { group: g.label, item: item.label };
        }
      }
    }
    return { group: 'Admin', item: 'Console' };
  }, [groups, pathname]);

  return (
    <header
      style={{
        flexShrink: 0,
        display: 'flex',
        height: 56,
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        borderBottom: `1px solid ${P.sage}`,
        backgroundColor: 'rgba(232, 237, 223, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}
    >
      <button
        type="button"
        className="rounded-lg p-2 lg:hidden"
        style={{ color: P.inkSoft }}
        onClick={onOpenMenu}
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: P.inkSoft,
          }}
        >
          {current.group}
        </div>
        <h1
          className="truncate"
          style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: P.ink, margin: 0 }}
        >
          {current.item}
        </h1>
      </div>
    </header>
  );
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('admin-theme');
    return () => {
      root.classList.remove('admin-theme');
    };
  }, []);

  const themeVars = {
    backgroundColor: P.paper,
    ['--primary']: '43 88% 66%',
    ['--primary-foreground']: '60 1% 14%',
    ['--ring']: '43 88% 66%',
    ['--background']: '84 28% 90%',
    ['--foreground']: '60 1% 14%',
    ['--card']: '152 14% 96%',
    ['--muted']: '152 14% 84%',
    ['--muted-foreground']: '120 2% 30%',
    ['--border']: '152 14% 78%',
    ['--color-primary']: P.yellow,
    ['--color-ring']: P.yellow,
    ['--color-primary-foreground']: P.ink,
  } as CSSProperties;

  return (
    <div
      className="admin-theme"
      style={{
        ...themeVars,
        // Pin to the viewport — ignores parent height/overflow chains
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex"
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          flexDirection: 'column',
          backgroundColor: P.ink,
          borderRight: `1px solid ${P.inkSoft}`,
        }}
      >
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              backgroundColor: 'rgba(36, 36, 35, 0.55)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <aside
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: SIDEBAR_WIDTH,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: P.ink,
              borderRight: `1px solid ${P.inkSoft}`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            }}
          >
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <AdminHeader onOpenMenu={() => setMobileOpen(true)} />
        <main
          id="main-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminPermissionsProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminPermissionsProvider>
  );
}
