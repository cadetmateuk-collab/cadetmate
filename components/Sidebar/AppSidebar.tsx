'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft, Menu, LogOut, Sparkles, X, Lock, MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { PremiumLockModal } from '../PremiumLockModal';
import {
  APP_NAV_GROUPS,
  MOBILE_BOTTOM_NAV,
  filterNavForUser,
  isGroupActive,
  isNavItemActive,
} from '@/lib/navigation/config';
import type { UserRole } from '@/lib/navigation/types';
import {
  SIDEBAR_COLORS,
  SIDEBAR_NOISE_SVG,
  SIDEBAR_TEXT,
} from './sidebar-styles';
import {
  SidebarCollapsibleGroup,
  SidebarNavItem,
  SidebarSectionLabel,
} from './SidebarNavComponents';

interface UserProfile {
  name: string;
  email: string;
  initials: string;
  role?: UserRole;
}

export function AppSidebar({ className, defaultCollapsed = false }: { className?: string; defaultCollapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  const isPremium = useMemo(
    () =>
      userProfile?.role === 'admin' ||
      userProfile?.role === 'premium' ||
      userProfile?.role === 'content',
    [userProfile],
  );

  const navGroups = useMemo(
    () => filterNavForUser(APP_NAV_GROUPS, userProfile?.role),
    [userProfile?.role],
  );

  const handleLockedClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPremiumModal(true);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single();
      const name = p?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      setUserProfile({
        name,
        email: p?.email || user.email || '',
        initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        role: (p?.role as UserRole) || 'free',
      });
    };
    fetchUser();
  }, []);

  const renderNavItems = (collapsed: boolean) =>
    navGroups.map((group) => {
      const groupActive = isGroupActive(pathname, group.items);
      const isSingleItem = group.items.length === 1 && group.id !== 'learn' && group.id !== 'practice';

      if (isSingleItem) {
        const item = group.items[0];
        return (
          <div key={group.id}>
            <SidebarSectionLabel isCollapsed={collapsed}>{group.label}</SidebarSectionLabel>
            <SidebarNavItem
              item={item}
              isActive={isNavItemActive(pathname, item.href, item.exact)}
              isCollapsed={collapsed}
              locked={item.premiumOnly && !isPremium}
              onLockedClick={handleLockedClick}
              navRef={navRef}
            />
          </div>
        );
      }

      return (
        <SidebarCollapsibleGroup
          key={group.id}
          label={group.label}
          isCollapsed={collapsed}
          defaultOpen={group.defaultOpen}
          isGroupActive={groupActive}
        >
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={isNavItemActive(pathname, item.href, item.exact)}
              isCollapsed={collapsed}
              locked={item.premiumOnly && !isPremium}
              onLockedClick={handleLockedClick}
              navRef={navRef}
            />
          ))}
        </SidebarCollapsibleGroup>
      );
    });

  const sidebarFooter = (collapsed: boolean) => (
    <div
      className={cn('flex-shrink-0 border-t', SIDEBAR_TEXT.border)}
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.38) 100%)',
      }}
    >
      {userProfile && (
        <div className={cn('pt-2 pb-1', collapsed ? 'flex justify-center px-2' : 'px-2')}>
          {isPremium ? (
            !collapsed && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ background: 'rgba(248,233,161,0.08)', borderColor: 'rgba(248,233,161,0.2)' }}
              >
                <Sparkles className="h-[15px] w-[15px] flex-shrink-0" style={{ color: SIDEBAR_COLORS.yellow }} />
                <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: SIDEBAR_COLORS.yellow }}>
                  Premium Active
                </span>
              </div>
            )
          ) : (
            <button
              onClick={() => setShowPremiumModal(true)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg text-[13px] font-bold text-white transition-all',
                collapsed ? 'p-2' : 'w-full px-3 py-2',
              )}
              style={{
                background: 'rgba(255,255,255,0.13)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <Sparkles className="h-[15px] w-[15px]" />
              {!collapsed && 'Upgrade to Premium'}
            </button>
          )}
        </div>
      )}

      <div className={cn('px-2 pb-3 pt-1', collapsed && 'flex justify-center')}>
        {userProfile ? (
          collapsed ? (
            <button
              onClick={() => router.push('/profile')}
              title={userProfile.name}
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <span className="text-[11px] font-bold text-white">{userProfile.initials}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-2 rounded-lg hover:bg-white/8 transition-colors"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-[10px] font-bold text-white">{userProfile.initials}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[12.5px] font-medium text-white truncate">{userProfile.name}</p>
                  <p className="text-[11px] text-white/55 truncate">{userProfile.email}</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/logout')}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="h-[15px] w-[15px]" />
              </button>
            </div>
          )
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg text-[13px] font-bold text-white',
              collapsed ? 'p-2' : 'w-full px-3 py-2',
            )}
            style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <Lock className="h-4 w-4" />
            {!collapsed && 'Log In'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {mounted && isMobile && createPortal(
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', flexDirection: 'column',
              background: SIDEBAR_COLORS.primary,
              transform: isMobileOpen ? 'translateY(0)' : 'translateY(100%)',
              opacity: isMobileOpen ? 1 : 0,
              pointerEvents: isMobileOpen ? 'auto' : 'none',
              transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s ease',
            }}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-lg overflow-hidden">
                  <Image src="/images/c2.png" alt="Cadet Mate" fill className="object-contain p-1" />
                </div>
                <div>
                  <h1 className="font-semibold text-[15px] text-white">Cadet Mate</h1>
                  <p className="text-[10px] text-white/50">Maritime Training</p>
                </div>
              </div>
              <button onClick={closeMobileMenu} className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/12">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <nav ref={navRef} className="flex-1 overflow-y-auto p-4">
              {renderNavItems(false)}
            </nav>
            {sidebarFooter(false)}
          </div>

          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, zIndex: 9998,
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              background: SIDEBAR_COLORS.primary,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {MOBILE_BOTTOM_NAV.map(({ id, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <button
                  key={id}
                  onClick={() => router.push(href)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full"
                >
                  <Icon className="h-5 w-5" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.45)' }} />
                  {active && <span className="w-1 h-1 rounded-full bg-white" />}
                </button>
              );
            })}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full"
              aria-label="More menu"
            >
              <MoreHorizontal className="h-5 w-5 text-white/70" />
            </button>
          </div>
        </>,
        document.body,
      )}

      <aside
        className={cn(
          'hidden lg:flex lg:relative lg:h-screen overflow-hidden',
          'transition-[width] duration-300 ease-in-out',
          isCollapsed ? 'lg:w-[56px]' : 'lg:w-60',
          className,
        )}
        style={{ background: SIDEBAR_COLORS.primary, borderRight: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: SIDEBAR_NOISE_SVG,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
            opacity: 0.03,
            mixBlendMode: 'overlay',
          }}
        />
        <div className="relative z-20 flex flex-col h-full overflow-hidden" style={{ width: isCollapsed ? 56 : 240 }}>
          <div className={cn('flex items-center border-b flex-shrink-0 h-[60px]', SIDEBAR_TEXT.border)} style={{ background: SIDEBAR_COLORS.primary }}>
            <div
              className="flex items-center gap-2.5 pl-4 flex-1 min-w-0 overflow-hidden transition-all duration-300"
              style={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : undefined }}
            >
              <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/images/c2.png" alt="Cadet Mate" fill className="object-contain p-1" priority />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-[14px] text-white leading-tight">Cadet Mate</h1>
                <p className="text-[10px] text-white/50">Maritime Training</p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed((p) => !p)}
              className="flex-shrink-0 p-1.5 mr-2 rounded-lg text-white/50 hover:text-white"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', isCollapsed && 'rotate-180')} />
            </button>
          </div>

          <nav ref={navRef} className="relative flex-1 overflow-y-auto overflow-x-hidden p-2" style={{ background: SIDEBAR_COLORS.primary }}>
            {renderNavItems(isCollapsed)}
          </nav>

          {sidebarFooter(isCollapsed)}
        </div>
      </aside>

      <PremiumLockModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}
