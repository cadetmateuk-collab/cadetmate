'use client';

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Mail, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavUser } from '@/lib/auth/nav-user';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SidebarMenuButton } from '@/components/layout/MainSidebar';
import {
  NavDropdownPanel,
  NavDropdownItem,
} from '@/components/layout/NavDropdownPanel';
import { UserAvatar } from '@/components/auth/onboarding/UserAvatar';

type AppHeaderProps = {
  variant: 'app' | 'public';
  user?: NavUser | null;
  onOpenSidebar: () => void;
};

function rankLabel(role: NavUser['role']) {
  if (role === 'admin') return 'Admin';
  if (role === 'content') return 'Content';
  if (role === 'premium') return 'Premium Cadet';
  return 'Deck Cadet';
}

/** Public header search — navigates to free content results */
function PublicSearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/free-content?q=${encodeURIComponent(query)}` : '/free-content');
  };

  return (
    <form onSubmit={onSubmit} className={cn('w-full', className)} role="search">
      <label htmlFor="public-header-search" className="sr-only">
        Search courses, topics, resources
      </label>
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="public-header-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses, topics, resources..."
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/35 focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </form>
  );
}

export function AppHeader({ variant, user, onOpenSidebar }: AppHeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileOpen]);

  const closeProfile = useCallback(() => setProfileOpen(false), []);

  return (
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-white">
      <div className="flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8">
        <SidebarMenuButton onClick={onOpenSidebar} />

        {/* Search */}
        <div className="min-w-0 flex-1 max-w-2xl">
          {variant === 'app' ? <GlobalSearch variant="bar" /> : <PublicSearchBar />}
        </div>

        {/* Right actions */}
        {variant === 'app' && user ? (
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto">
            <NotificationCenter />

            <Link
              href="/community"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Message centre"
              title="Message centre"
            >
              <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>

            <div ref={profileRef} className="relative ml-1 sm:ml-2">
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-2 sm:pr-3 hover:bg-slate-50 hover:border-border/70 transition-colors min-h-[44px]"
                aria-label="Profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="inline-flex overflow-visible rounded-full ring-2 ring-primary/15">
                  <UserAvatar
                    fullName={user.name}
                    avatarKind={user.avatarKind}
                    avatarPreset={user.avatarPreset}
                    avatarColor={user.avatarColor}
                    size={36}
                    role={user.role}
                    badgeScale={0.25}
                  />
                </span>
                <span className="hidden sm:block text-left leading-tight min-w-0">
                  <span className="block text-sm font-semibold text-foreground truncate max-w-[140px]">
                    {user.name}
                  </span>
                  <span className="block text-[11px] font-medium text-muted-foreground truncate">
                    {rankLabel(user.role)}
                  </span>
                </span>
                <ChevronDown
                  className="hidden sm:block h-3.5 w-3.5 text-muted-foreground shrink-0"
                  aria-hidden
                />
              </button>

              {profileOpen && (
                <NavDropdownPanel align="right" className="w-56">
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-border mb-1">
                    <UserAvatar
                      fullName={user.name}
                      avatarKind={user.avatarKind}
                      avatarPreset={user.avatarPreset}
                      avatarColor={user.avatarColor}
                      size={40}
                      role={user.role}
                      badgeScale={0.25}
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{rankLabel(user.role)}</p>
                    </div>
                  </div>
                  <NavDropdownItem
                    onClick={() => {
                      closeProfile();
                      router.push('/profile');
                    }}
                  >
                    Profile
                  </NavDropdownItem>
                  <NavDropdownItem
                    onClick={() => {
                      closeProfile();
                      router.push('/settings');
                    }}
                  >
                    Settings
                  </NavDropdownItem>
                  <NavDropdownItem
                    onClick={() => {
                      closeProfile();
                      router.push('/logout');
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </NavDropdownItem>
                </NavDropdownPanel>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center h-10 px-2.5 sm:px-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              Log In
            </Link>
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center h-10 px-3 sm:px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
