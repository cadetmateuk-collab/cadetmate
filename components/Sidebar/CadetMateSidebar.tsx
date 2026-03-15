"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen, Briefcase, FileText, Anchor, Lightbulb,
  ShoppingBag, ChevronLeft, Menu, LogOut,
  Lock, Sparkles, House, X, Compass, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumLockModal } from "../PremiumLockModal";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  email: string;
  initials: string;
  role?: "free" | "premium" | "admin";
}

interface CadetMateSidebarProps {
  className?: string;
  defaultCollapsed?: boolean;
}

interface SidebarContentProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  userProfile: UserProfile | null;
  isPremium: boolean;
  isAdmin: boolean;
  mounted: boolean;
  pathname: string;
  theme: string | undefined;
  onToggleSidebar: () => void;
  onLockedClick: (e: React.MouseEvent) => void;
  onUpgradeClick: () => void;
  onToggleTheme: () => void;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary: "#2966F4",
  yellow:  "#F8E9A1",
  // darkened overlay for header/footer zones
  dark:    "rgba(0,0,0,0.28)",
};

const T = {
  // near-white idle text
  idle:   "text-white/90",
  border: "border-white/10",
  label:  "text-white text-[10px] font-semibold uppercase tracking-[1.4px]",
};

// Glassmorphism helper — border is ALWAYS 1px (transparent when idle) to prevent layout nudge
const glassStyle = (strength: "idle" | "hover" | "active"): React.CSSProperties => ({
  background:           strength === "active" ? "rgba(255,255,255,0.18)" : strength === "hover" ? "rgba(255,255,255,0.11)" : "transparent",
  backdropFilter:       strength !== "idle" ? "blur(8px)" : undefined,
  WebkitBackdropFilter: strength !== "idle" ? "blur(8px)" : undefined,
  border:               `1px solid rgba(255,255,255,${strength === "active" ? "0.22" : strength === "hover" ? "0.13" : "0"})`,
  boxShadow:            strength === "active"
    ? "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25)"
    : strength === "hover"
    ? "inset 0 1px 0 rgba(255,255,255,0.14)"
    : undefined,
});

// ─── Noise texture ────────────────────────────────────────────────────────────

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

// ─── Shared small components ──────────────────────────────────────────────────

function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] rounded-r-full bg-white"
      style={{ boxShadow: "0 0 6px rgba(255,255,255,0.7)" }}
    />
  );
}

function SectionLabel({ children, isCollapsed }: { children: React.ReactNode; isCollapsed: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ height: "36px" }}>
      {/* Expanded: text label */}
      <p
        className={cn(T.label, "absolute inset-0 flex items-end px-3 pb-1 whitespace-nowrap transition-all duration-300")}
        style={{ opacity: isCollapsed ? 0 : 1, transform: isCollapsed ? "translateX(-4px)" : "translateX(0)" }}
      >
        {children}
      </p>
      {/* Collapsed: thin divider line, vertically centred */}
      <div
        className="absolute inset-0 flex items-center px-2 transition-all duration-300"
        style={{ opacity: isCollapsed ? 1 : 0 }}
      >
        <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon, label, href, isActive, locked, onLockedClick, isCollapsed, navRef,
}: {
  icon: React.ElementType; label: string; href: string;
  isActive: boolean; locked?: boolean;
  onLockedClick?: (e: React.MouseEvent) => void;
  isCollapsed: boolean;
  navRef: React.RefObject<HTMLElement>;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  // Clear hover if sidebar collapses while cursor is over item
  useEffect(() => { setHovered(false); }, [isCollapsed]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Only set hovered if the mouse came from within the nav — not from the header above
    const from = e.relatedTarget as Node | null;
    if (from && navRef.current && !navRef.current.contains(from)) return;
    setHovered(true);
  };

  const dynamicStyle: React.CSSProperties =
    isActive ? glassStyle("active") :
    hovered  ? glassStyle("hover")  :
               glassStyle("idle");

  return (
    <div className="relative">
      {isActive && <ActiveBar />}
      <button
        onClick={(e) => locked && onLockedClick ? onLockedClick(e) : router.push(href)}
        title={isCollapsed ? label : undefined}
        style={dynamicStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          // Vertical padding always identical so icon never shifts on toggle
          "relative flex items-center w-full rounded-lg transition-all duration-150 cursor-pointer py-[9px]",
          // Horizontal: centered when collapsed, left-padded when expanded
          isCollapsed ? "justify-center px-[10px]" : "pl-3 pr-3 gap-2.5",
          isActive ? "text-white font-semibold" : T.idle,
          locked && "opacity-40",
        )}
      >
        <Icon className="h-[16px] w-[16px] flex-shrink-0" />
        {/* Label: always in DOM, width animates 0↔auto, opacity fades — icon never moves */}
        <span
          className={cn(
            "text-[13px] text-left whitespace-nowrap overflow-hidden tracking-[0.1px] transition-all duration-300",
            isCollapsed ? "w-0 opacity-0 pointer-events-none" : "flex-1 opacity-100",
          )}
        >
          {label}
        </span>
        {locked && !isCollapsed && <Lock className="h-3 w-3 flex-shrink-0 opacity-50" />}
      </button>
    </div>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({
  isCollapsed, isMobileOpen, userProfile, isPremium, isAdmin,
  mounted, pathname, theme,
  onToggleSidebar, onLockedClick, onUpgradeClick, onToggleTheme,
}: SidebarContentProps) {
  const router   = useRouter();
  const isActive = (path) => {
  return pathname.startsWith(path);
};
  const navRef   = useRef<HTMLElement>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header — darker zone, fixed height ── */}
      <div
        className={cn("flex items-center border-b flex-shrink-0 h-[60px] z-10", T.border)}
        style={{ background: C.primary }}
        onMouseEnter={() => {/* block nav hover bleed */}}
      >
        {/* Logo + wordmark — fades out when collapsed */}
        <div
          className="flex items-center gap-2.5 pl-4 flex-1 min-w-0 overflow-hidden transition-all duration-300"
          style={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : undefined, paddingLeft: isCollapsed ? 0 : undefined }}
        >
          <div
            className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0"
          >
            <Image src="/images/c2.png" alt="Cadet Mate" fill className="object-contain p-1" priority />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-[14px] text-white leading-tight whitespace-nowrap tracking-wide">
              Cadet Mate
            </h1>
            <p className="text-[10px] leading-tight whitespace-nowrap text-white/50">
              Maritime Training
            </p>
          </div>
        </div>

        {/* Toggle arrow — normal flow, always far-right, never overlaps nav */}
        <button
          onClick={onToggleSidebar}
          className="flex-shrink-0 p-1.5 mr-2 rounded-lg transition-colors text-white/50 hover:text-white"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMobileOpen
            ? <X className="h-4 w-4" />
            : <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
          }
        </button>
      </div>

      {/* ── Nav — flat primary colour + faint radial glow ── */}
      <nav
        ref={navRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: "10px 8px", background: C.primary }}
      >
        {/* Faint white radial glow — middle right */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            right: "-20%",
            top: "35%",
            width: "180px",
            height: "220px",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 70%)",
            borderRadius: "50%",
            filter: "blur(12px)",
          }}
        />
        <SectionLabel isCollapsed={isCollapsed}>Platform</SectionLabel>
        <NavItem icon={House}       label="Home"         href="/home"         isActive={isActive("/home")}         isCollapsed={isCollapsed} navRef={navRef} />
        <NavItem icon={ShoppingBag} label="Store"        href="/store"        isActive={isActive("/store")}        isCollapsed={isCollapsed} navRef={navRef} />
        <NavItem icon={Sparkles}    label="Free Content" href="/free-content" isActive={isActive("/free-content")} isCollapsed={isCollapsed} navRef={navRef} />

        <SectionLabel isCollapsed={isCollapsed}>Resources</SectionLabel>
        <NavItem icon={BookOpen}  label="Unit Modules"        href="/unit-modules"             isActive={isActive("/unit-modules")}             locked={!isPremium} onLockedClick={onLockedClick} isCollapsed={isCollapsed} navRef={navRef} />
        <NavItem icon={Briefcase} label="Work Based Learning" href="/work-based-learning" isActive={isActive("/work-based-learning")} locked={!isPremium} onLockedClick={onLockedClick} isCollapsed={isCollapsed} navRef={navRef} />
        <NavItem icon={FileText}  label="TRB"                 href="/trb"                 isActive={isActive("/trb")}                 locked={!isPremium} onLockedClick={onLockedClick} isCollapsed={isCollapsed} navRef={navRef} />
        <NavItem icon={Anchor}    label="Sea Survival"        href="/sea-survival"        isActive={isActive("/sea-survival")}        locked={!isPremium} onLockedClick={onLockedClick} isCollapsed={isCollapsed} navRef={navRef} />
        <NavItem icon={Lightbulb} label="General Tips"        href="/general-tips"        isActive={isActive("/general-tips")}        locked={!isPremium} onLockedClick={onLockedClick} isCollapsed={isCollapsed} navRef={navRef} />

        <SectionLabel isCollapsed={isCollapsed}>Simulators</SectionLabel>
        <NavItem icon={Compass}  label="Emergencies" href="/simulator"  isActive={isActive("/simulator")}  locked={!isPremium} onLockedClick={onLockedClick} isCollapsed={isCollapsed} navRef={navRef} />

        {isAdmin && (
          <>
            <SectionLabel isCollapsed={isCollapsed}>Management</SectionLabel>
            <NavItem icon={House} label="Home"  href="/admin/admin-home" isActive={isActive("/admin/admin-home")} isCollapsed={isCollapsed} navRef={navRef} />
            <NavItem icon={Settings} label="Module Management"  href="/admin/modules" isActive={isActive("/admin/modules")} isCollapsed={isCollapsed} navRef={navRef} />
            <NavItem icon={BookOpen} label="Module Builder"  href="/admin/module-builder" isActive={isActive("/admin/module-builder")} isCollapsed={isCollapsed} navRef={navRef} />
          </>
        )}
      </nav>

      {/* ── Footer — darker zone ── */}
      <div
        className={cn("flex-shrink-0 border-t", T.border)}
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.38) 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }}
      >
        {/* Theme toggle — hidden for now */}
        {false && mounted && (
          <div className={cn("pt-2", isCollapsed ? "flex justify-center" : "px-2")}>
            <button
              onClick={onToggleTheme}
              title={isCollapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
              className={cn(
                "flex items-center rounded-lg text-[13px] transition-all duration-150 text-white/90 hover:text-white",
                isCollapsed ? "p-2" : "w-full gap-2.5 px-3 py-2",
              )}
            >
              {theme === "dark"
                ? <Sun  className="h-[16px] w-[16px] flex-shrink-0" />
                : <Moon className="h-[16px] w-[16px] flex-shrink-0" />}
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Premium badge / upgrade */}
        {userProfile && (
          <div className={cn("pt-2 pb-1", isCollapsed ? "flex justify-center px-2" : "px-2")}>
            {isPremium ? (
              isCollapsed ? (
                <button title="Premium Active" className="p-2 rounded-lg" style={{ color: C.yellow }}>
                  <Sparkles className="h-[16px] w-[16px]" />
                </button>
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ background: "rgba(248,233,161,0.08)", borderColor: "rgba(248,233,161,0.2)" }}
                >
                  <Sparkles className="h-[15px] w-[15px] flex-shrink-0" style={{ color: C.yellow }} />
                  <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: C.yellow }}>
                    Premium Active
                  </span>
                </div>
              )
            ) : (
              isCollapsed ? (
                <button
                  onClick={onUpgradeClick}
                  title="Upgrade to Premium"
                  className="p-2 rounded-lg text-white/90 hover:text-white transition-colors"
                >
                  <Sparkles className="h-[16px] w-[16px]" />
                </button>
              ) : (
                <button
                  onClick={onUpgradeClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-bold transition-all text-white"
                  style={{
                    background: "rgba(255,255,255,0.13)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
                >
                  <Sparkles className="h-[15px] w-[15px] flex-shrink-0" />
                  <span className="whitespace-nowrap">Upgrade to Premium</span>
                </button>
              )
            )}
          </div>
        )}

        {/* User profile / login */}
        <div className={cn("px-2 pb-3 pt-1", isCollapsed && "flex justify-center px-2")}>
          {userProfile ? (
            isCollapsed ? (
              <button
                onClick={() => router.push("/settings")}
                title={userProfile.name}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <span className="text-[11px] font-bold text-white">{userProfile.initials}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-2 rounded-lg transition-colors hover:bg-white/8"
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span className="text-[10px] font-bold text-white">{userProfile.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12.5px] font-medium text-white truncate leading-tight">
                      {userProfile.name}
                    </p>
                    <p className="text-[11px] truncate leading-tight text-white/55">
                      {userProfile.email}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/logout")}
                  className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors text-white/40"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F76C6C")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  aria-label="Logout"
                >
                  <LogOut className="h-[15px] w-[15px]" />
                </button>
              </div>
            )
          ) : (
            isCollapsed ? (
              <button
                onClick={() => router.push("/auth")}
                title="Log In"
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <Lock className="h-4 w-4 text-white" />
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-bold transition-all text-white"
                style={{
                  background: "rgba(255,255,255,0.13)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
              >
                <Lock className="h-4 w-4" />
                Log In
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CadetMateSidebar({ className, defaultCollapsed = false }: CadetMateSidebarProps) {
  const [isCollapsed,      setIsCollapsed]      = useState(defaultCollapsed);
  const [isMobileOpen,     setIsMobileOpen]     = useState(false);
  const [userProfile,      setUserProfile]      = useState<UserProfile | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [mounted,          setMounted]          = useState(false);

  const pathname            = usePathname();
  const { theme, setTheme } = useTheme();

  const isPremium = useMemo(() => userProfile?.role === "admin" || userProfile?.role === "premium", [userProfile]);
  const isAdmin   = useMemo(() => userProfile?.role === "admin", [userProfile]);

  // Auto-collapse when entering a module route, restore when leaving
  const preModuleCollapsed = useRef<boolean | null>(null);
  const isModuleRoute = pathname.startsWith("/module/") || pathname.startsWith("/modules/");

  useEffect(() => {
    if (isModuleRoute) {
      if (preModuleCollapsed.current === null) {
        preModuleCollapsed.current = isCollapsed;
      }
      setIsCollapsed(true);
    } else {
      if (preModuleCollapsed.current !== null) {
        setIsCollapsed(preModuleCollapsed.current);
        preModuleCollapsed.current = null;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModuleRoute]);

  const handleLockedClick   = useCallback((e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowPremiumModal(true); }, []);
  const closeMobileMenu     = useCallback(() => setIsMobileOpen(false), []);
  const handleToggleSidebar = useCallback(() => isMobileOpen ? closeMobileMenu() : setIsCollapsed((p) => !p), [isMobileOpen, closeMobileMenu]);
  const handleToggleTheme   = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    document.body.style.position = isMobileOpen ? "fixed"  : "";
    document.body.style.width    = isMobileOpen ? "100%"   : "";
    return () => { document.body.style.overflow = ""; document.body.style.position = ""; document.body.style.width = ""; };
  }, [isMobileOpen]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", user.id)
          .single();
        const name = p?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUserProfile({
          name,
          email:    p?.email || user.email || "",
          initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
          role:     p?.role || "free",
        });
      } catch (e) {
        console.error("Sidebar user fetch error:", e);
      }
    };
    fetchUser();
  }, []);

  const contentProps: SidebarContentProps = {
    isCollapsed, isMobileOpen, userProfile, isPremium, isAdmin,
    mounted, pathname, theme,
    onToggleSidebar: handleToggleSidebar,
    onLockedClick:   handleLockedClick,
    onUpgradeClick:  () => setShowPremiumModal(true),
    onToggleTheme:   handleToggleTheme,
  };

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4"
        style={{ background: C.primary, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.8)" }}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="relative h-7 w-7 flex-shrink-0">
            <Image src="/images/c2.png" alt="Cadet Mate" fill className="object-contain" priority />
          </div>
          <span className="font-semibold text-[14px] text-white tracking-wide">Cadet Mate</span>
        </div>
        {/* Right side — show user initials if logged in, else spacer */}
        <div className="w-10 flex justify-end">
          {userProfile && (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
            >
              <span className="text-[11px] font-bold text-white">{userProfile.initials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:relative lg:h-screen overflow-hidden",
          "transition-[width] duration-300 ease-in-out",
          isCollapsed ? "lg:w-[56px]" : "lg:w-60",
          isMobileOpen && "!flex fixed inset-y-0 left-0 z-50 w-72",
          className,
        )}
        style={{
          background:  C.primary,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          height: isMobileOpen ? "100dvh" : undefined,
        }}
      >
        {/* Noise grain overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: NOISE_SVG,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            opacity: 0.03,
            mixBlendMode: "overlay",
          }}
        />

        <div
          className="relative z-20 flex flex-col h-full overflow-hidden"
          style={{ width: isMobileOpen ? "100%" : isCollapsed ? "56px" : "240px" }}
        >
          <SidebarContent {...contentProps} />
        </div>
      </aside>

      <PremiumLockModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}