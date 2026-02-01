"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen,
  Briefcase,
  FileText,
  Anchor,
  Lightbulb,
  ShoppingBag,
  ChevronLeft,
  Menu,
  Settings,
  LogOut,
  Moon,
  Sun,
  Shield,
  Lock,
  Sparkles,
  House,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarDropdown } from "./SidebarDropdown";
import { PremiumLockModal } from "../PremiumLockModal";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface ModuleGroup {
  label: string;
  items: { label: string; href: string }[];
}

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

const CACHE_KEY = {
  MODULES: "cadetmate_modules",
  USER: "cadetmate_user",
};

const CACHE_DURATION = 5 * 60 * 1000;

const cache = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      return Date.now() - timestamp > CACHE_DURATION ? null : data;
    } catch {
      return null;
    }
  },
  set: (key: string, data: any) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.warn("Cache error:", error);
    }
  },
};

export function CadetMateSidebar({ className, defaultCollapsed = false }: CadetMateSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unitModules, setUnitModules] = useState<ModuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [openModuleChildren, setOpenModuleChildren] = useState<Record<string, boolean>>({});
  const [openAdminChildren, setOpenAdminChildren] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const isPremium = useMemo(
    () => userProfile?.role === "admin" || userProfile?.role === "premium",
    [userProfile]
  );
  const isAdmin = useMemo(() => userProfile?.role === "admin", [userProfile]);

  const isActive = useCallback((path: string) => pathname === path, [pathname]);
  const isModuleActive = useCallback(() => pathname?.startsWith("/modules/"), [pathname]);
  const isAdminActive = useCallback(() => pathname?.startsWith("/admin/"), [pathname]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    const fetchData = async () => {
      const cachedModules = cache.get(CACHE_KEY.MODULES);
      const cachedUser = cache.get(CACHE_KEY.USER);

      if (cachedModules && cachedUser) {
        setUnitModules(cachedModules);
        setUserProfile(cachedUser);
        setLoading(false);
      }

      const supabase = createClient();

      try {
        const [categoriesResponse, modulesResult, userResult] = await Promise.all([
          fetch("/api/admin/categories"),
          supabase
            .from("modules")
            .select("id, title, category, subcategory, slug")
            .eq("hidden", false)
            .order("category")
            .order("subcategory"),
          supabase.auth.getUser(),
        ]);

        const categoriesResult = await categoriesResponse.json();
        const visibleCategories = (categoriesResult.data || []).filter((c: any) => !c.hidden);
        const categoryNames = visibleCategories.map((c: any) => c.name);

        const { data: modules } = modulesResult;

        // Sort modules numerically then alphabetically
        const sortModules = (a: any, b: any) => {
          const getLeadingNumber = (str: string) => {
            const match = str.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : null;
          };

          const numA = getLeadingNumber(a.title);
          const numB = getLeadingNumber(b.title);

          if (numA !== null && numB !== null) {
            if (numA !== numB) return numA - numB;
          }
          
          if (numA !== null && numB === null) return -1;
          if (numA === null && numB !== null) return 1;

          return a.title.localeCompare(b.title);
        };

        const sortedModules = modules?.sort(sortModules);

        const grouped = sortedModules?.reduce((acc: Record<string, any[]>, module: any) => {
          if (categoryNames.includes(module.category)) {
            if (!acc[module.category]) acc[module.category] = [];
            acc[module.category].push(module);
          }
          return acc;
        }, {});

        const sortedGrouped: Record<string, any[]> = {};
        categoryNames.forEach((cat: string) => {
          if (grouped?.[cat]) sortedGrouped[cat] = grouped[cat];
        });

        const transformed: ModuleGroup[] = Object.entries(sortedGrouped).map(
          ([category, items]) => ({
            label: category,
            items: items.map((item) => ({
              label: item.title,
              href: `/modules/${item.slug}`,
            })),
          })
        );

        const { data: { user } } = userResult;
        let userProfileData: UserProfile | null = null;

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, role")
            .eq("id", user.id)
            .single();

          const name =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User";
          const email = profile?.email || user.email || "";
          const role = profile?.role || "free";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          userProfileData = { name, email, initials, role };
        }

        setUnitModules(transformed);
        setUserProfile(userProfileData);
        cache.set(CACHE_KEY.MODULES, transformed);
        cache.set(CACHE_KEY.USER, userProfileData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLockedClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPremiumModal(true);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), []);

  const renderNavItem = useCallback(
    (Icon: any, label: string, href: string, isLocked: boolean = false) => {
      if (isLocked && !isPremium) {
        return (
          <div key={href} className="relative">
            <div onClick={handleLockedClick} className="absolute inset-0 z-10 cursor-pointer" />
            <div className="opacity-60">
              <SidebarNavItem
                icon={Icon}
                label={
                  <div className="flex items-center justify-between flex-1">
                    <span>{label}</span>
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                }
                href={href}
                isActive={isActive(href)}
              />
            </div>
          </div>
        );
      }

      return (
        <SidebarNavItem
          key={href}
          icon={Icon}
          label={label}
          href={href}
          isActive={isActive(href)}
        />
      );
    },
    [isPremium, handleLockedClick, isActive]
  );

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="h-[73px] flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/logo.png" alt="Cadet Mate" fill className="object-contain" priority />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-semibold text-base text-foreground">Cadet Mate</h1>
              <p className="text-xs text-muted-foreground">Maritime Training</p>
            </div>
          )}
        </div>
        <button
          onClick={() => (isMobileOpen ? closeMobileMenu() : setIsCollapsed(!isCollapsed))}
          className="p-2 rounded-md hover:bg-muted transition-colors lg:hidden text-foreground"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 bg-card">
        <div className="space-y-1">
          {renderNavItem(House, "Home", "/home")}
          {renderNavItem(ShoppingBag, "Store", "/store")}
          {renderNavItem(Sparkles, "Free Content", "/free-content")}

          {isAdmin && (
            <SidebarDropdown
              icon={Shield}
              label="Admin"
              items={[
                {
                  label: "Management",
                  children: [
                    { label: "Module Builder", href: "/admin/module-builder" },
                    { label: "Module Management", href: "/admin/modules" },
                    { label: "User Management", href: "/admin/users" },
                    { label: "Analytics", href: "/admin/analytics" },
                  ],
                },
              ]}
              isActive={isAdminActive()}
              isOpen={adminOpen}
              onToggle={() => setAdminOpen((prev) => !prev)}
              openChildren={openAdminChildren}
              setOpenChildren={setOpenAdminChildren}
            />
          )}

          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : unitModules.length > 0 ? (
            <div className="relative">
              {!isPremium && (
                <div onClick={handleLockedClick} className="absolute inset-0 z-10 cursor-pointer" />
              )}
              <div className={cn(!isPremium && "opacity-60 pointer-events-none")}>
                <SidebarDropdown
                  icon={BookOpen}
                  label={
                    <div className="flex items-center justify-between flex-1">
                      <span>Unit Modules</span>
                      {!isPremium && <Lock className="h-4 w-4 text-primary" />}
                    </div>
                  }
                  items={unitModules.map((module) => ({
                    label: module.label,
                    children: module.items,
                  }))}
                  isActive={isModuleActive()}
                  isOpen={modulesOpen}
                  onToggle={() => (isPremium ? setModulesOpen((prev) => !prev) : handleLockedClick({} as any))}
                  openChildren={openModuleChildren}
                  setOpenChildren={setOpenModuleChildren}
                />
              </div>
            </div>
          ) : null}

          {renderNavItem(Briefcase, "Work Based Learning", "/work-based-learning", true)}
          {renderNavItem(FileText, "TRB", "/trb", true)}
          {renderNavItem(Anchor, "Sea Survival", "/sea-survival", true)}
          {renderNavItem(Lightbulb, "General Tips", "/general-tips", true)}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border bg-card">
        {/* Premium Badge */}
        <div className="p-3 border-b border-border">
          {isPremium ? (
            <div className="w-full bg-primary text-primary-foreground rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-white">
                <Sparkles size={20} />
                <span className="font-semibold">Premium Active</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPremiumModal(true)}
              className="w-full bg-primary text-primary-foreground rounded-lg p-3 hover:opacity-90 transition-all"
            >
              <div className="flex items-center justify-center gap-2 text-white">
                <Sparkles size={20} />
                <span className="font-semibold">Upgrade to Premium</span>
              </div>
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/settings")}
              className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-card-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-card-foreground"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {!mounted ? (
                <Moon className="h-5 w-5" />
              ) : theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer min-w-0 hover:bg-muted transition-colors">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">{userProfile?.initials || "?"}</span>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate text-card-foreground">{userProfile?.name || "Loading..."}</p>
                <p className="text-xs truncate text-muted-foreground">{userProfile?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/logout")}
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-card-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Cadet Mate" fill className="object-contain" priority />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-card-foreground">Cadet Mate</h1>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative top-0 left-0 h-screen z-50 transition-all duration-300 border-r border-border bg-card",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      <PremiumLockModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}