"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Lock, CheckCircle2, Clock, ChevronRight, Sparkles,
  BookOpen, LayoutGrid, List, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from '@/lib/supabase/client';

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

type AccessLevel = "free" | "premium" | "admin";
type ViewMode    = "grid" | "list";
type FilterState = "all" | "available" | "locked" | "in-progress" | "completed";

/** Shape of a row in your Supabase `modules` table */
interface SupabaseModule {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  subcategory: string;
  hidden: boolean | null;
  is_premium: boolean | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | null;
  estimated_hours: number | null;
  total_lessons: number | null;
  accent_color: string | null;
  image_url: string | null;
  tags: string[] | null;
  blocks: any[] | null;
  pages: any[] | null;
  content: { pages?: any[]; blocks?: any[] } | null;
  created_at: string;
  updated_at: string | null;
}

/** Normalised shape used by the UI */
interface Module {
  id: string;
  category: string;
  title: string;
  slug: string;
  description: string;
  accentColor: string;
  glowColor: string;
  isPremium: boolean;
  isNew: boolean;
  isFeatured: boolean;
  totalLessons: number;
  estimatedHours: number;
  pageCount: number;
  totalMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  subModules: SubModule[];
  progressPercent?: number;
  tags: string[];
  imageUrl: string;
}

interface SubModule {
  id: string;
  title: string;
  slug: string;
  estimatedMinutes: number;
  isCompleted?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_ACCENT = "#2966f4";
const DEFAULT_IMAGE  =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop";

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(41,102,244,${alpha})`;
  }
}

/**
 * Resolve pages from whichever format the module uses:
 *   1. top-level `pages` array (new format)
 *   2. `content.pages` (new format nested)
 *   3. flat `blocks` / `content.blocks` with page-break separators (legacy)
 */
function resolvePages(row: SupabaseModule): { title: string; estimatedMinutes: number }[] {
  const pagesArr: any[] | null =
    (Array.isArray((row as any).pages) && (row as any).pages.length > 0 ? (row as any).pages : null) ??
    (Array.isArray((row as any).content?.pages) && (row as any).content.pages.length > 0 ? (row as any).content.pages : null);

  if (pagesArr) {
    return pagesArr.map((p: any) => ({
      title: p.title || "",
      estimatedMinutes: p.estimatedMinutes || 5,
    }));
  }

  const rawBlocks: any[] =
    (Array.isArray(row.blocks) ? row.blocks : null) ??
    (Array.isArray((row as any).content?.blocks) ? (row as any).content.blocks : []);

  if (rawBlocks.length === 0) return [];

  const pages: { title: string; estimatedMinutes: number }[] = [];
  let hasContent = false;
  for (const block of rawBlocks) {
    if (block.type === "page-break") {
      pages.push({ title: block.content?.pageTitle || block.content?.label || "", estimatedMinutes: block.content?.estimatedMinutes || 5 });
      hasContent = false;
    } else {
      hasContent = true;
    }
  }
  if (hasContent || pages.length === 0) pages.push({ title: "", estimatedMinutes: 5 });
  return pages;
}

function normalise(row: SupabaseModule): Module {
  const accent = row.accent_color || DEFAULT_ACCENT;
  const pages  = resolvePages(row);

  const pageCount    = pages.length;
  const totalMinutes = pages.reduce((sum, p) => sum + p.estimatedMinutes, 0);
  const estimatedHours = row.estimated_hours ?? (totalMinutes > 0 ? Math.round((totalMinutes / 60) * 10) / 10 : 1);

  const subModules: SubModule[] = pages.map((p, i) => ({
    id: `${row.id}-sub-${i}`,
    title: p.title || `Page ${i + 1}`,
    slug: `${row.slug}?section=${i + 1}`,
    estimatedMinutes: p.estimatedMinutes,
    isCompleted: false,
  }));

  return {
    id: row.id,
    category: row.category || "General",
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    accentColor: accent,
    glowColor: hexToRgba(accent, 0.15),
    isPremium: row.is_premium ?? false,
    isNew: row.is_new ?? false,
    isFeatured: row.is_featured ?? false,
    totalLessons: row.total_lessons ?? pageCount,
    estimatedHours,
    pageCount,
    totalMinutes,
    difficulty: row.difficulty ?? "Beginner",
    subModules,
    progressPercent: undefined,
    tags: row.tags || [],
    imageUrl: row.image_url || DEFAULT_IMAGE,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressRing({ percent, color, size = 36 }: { percent: number; color: string; size?: number }) {
  const r    = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner:     "text-emerald-600 bg-emerald-50 border-emerald-200",
  Intermediate: "text-amber-600 bg-amber-50 border-amber-200",
  Advanced:     "text-red-500 bg-red-50 border-red-200",
};

function ModuleCard({
  module, userAccess, viewMode, onSelect, onUpgrade, animDelay,
}: {
  module: Module; userAccess: AccessLevel; viewMode: ViewMode;
  onSelect: (m: Module) => void; onUpgrade: () => void; animDelay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLocked    = module.isPremium && userAccess === "free";
  const hasProgress = (module.progressPercent ?? 0) > 0;
  const isComplete  = module.progressPercent === 100;
  const completedLessons = module.subModules.filter((s) => s.isCompleted).length;

  const handleClick = () => { if (isLocked) { onUpgrade(); return; } onSelect(module); };

  // ── List view ──
  if (viewMode === "list") {
    return (
      <div
        className="group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm"
        style={{
          background: isLocked ? "hsl(var(--muted))" : "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
          animationDelay: `${animDelay}ms`,
        }}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="h-11 w-11 rounded-lg overflow-hidden flex-shrink-0">
          <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover"
            style={{ filter: isLocked ? "grayscale(60%) brightness(0.8)" : "brightness(0.92)" }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13.5px] font-semibold text-[hsl(var(--foreground))] truncate">{module.title}</span>
            {module.isNew && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)] flex-shrink-0">NEW</span>
            )}
            {module.isPremium && (
              <span className="flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 flex-shrink-0">
                <Sparkles className="h-2 w-2" /> Premium
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px] text-[hsl(var(--muted-foreground))]">
            <span style={{ color: isLocked ? undefined : module.accentColor }} className="font-medium">{module.category}</span>
            <span className="opacity-30">·</span>
            <span>{module.pageCount} pages</span>
            <span className="opacity-30">·</span>
            <span>{module.totalMinutes}m</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className={cn("text-[10.5px] font-medium px-2 py-0.5 rounded-full border hidden sm:inline-flex", DIFFICULTY_COLOR[module.difficulty])}>
            {module.difficulty}
          </span>
          {!isLocked && (
            <div className="relative w-8 h-8">
              <ProgressRing percent={module.progressPercent ?? 0} color={module.accentColor} size={32} />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold" style={{ color: module.accentColor }}>
                {module.progressPercent ?? 0}%
              </span>
            </div>
          )}
          {isLocked && <Lock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />}
          <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors" />
        </div>
      </div>
    );
  }

  // ── Grid card ──
  return (
    <div
      className={cn("group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300",
        isLocked ? "opacity-75" : "hover:-translate-y-1 hover:shadow-xl")}
      style={{
        background: "hsl(var(--card))",
        borderColor: expanded ? module.accentColor + "40" : "hsl(var(--border))",
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Glow top strip on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, transparent, ${module.accentColor}, transparent)` }} />

      {/* Course image banner */}
      <div className="relative w-full h-36 overflow-hidden">
        <img src={module.imageUrl} alt={module.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: isLocked ? "grayscale(60%) brightness(0.7)" : undefined }} />
        {/* Status badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {module.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[hsl(var(--primary))]">NEW</span>
          )}
          {module.isFeatured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-amber-600">⭐ Featured</span>
          )}
          {module.isPremium && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: isLocked ? 'rgba(0,0,0,0.45)' : 'rgba(124,58,237,0.85)' }}>
              <Sparkles className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 pb-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[1px] mb-1"
          style={{ color: isLocked ? "hsl(var(--muted-foreground))" : module.accentColor }}>
          {module.category}
        </p>
        <h3 className={cn("text-[15px] font-semibold leading-snug",
          isLocked ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]")}>
          {module.title}
        </h3>
      </div>

      {/* Tags */}
      {module.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {module.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10.5px] px-2 py-0.5 rounded-full border"
              style={{
                background: isLocked ? "hsl(var(--muted))" : `${module.accentColor}0d`,
                borderColor: isLocked ? "hsl(var(--border))" : `${module.accentColor}30`,
                color: isLocked ? "hsl(var(--muted-foreground))" : `${module.accentColor}bb`,
              }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 pb-3 pt-3 border-t border-[hsl(var(--border))] flex items-center gap-1.5 text-[11.5px] text-[hsl(var(--muted-foreground))]">
        <BookOpen className="h-3 w-3 flex-shrink-0" />
        <span>{module.pageCount} pages</span>
        <span className="opacity-30">·</span>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span>{module.totalMinutes}m</span>
        <span className="opacity-30 ml-auto">·</span>
        <span className={cn("text-[10.5px] font-medium px-2 py-0.5 rounded-full border", DIFFICULTY_COLOR[module.difficulty])}>
          {module.difficulty}
        </span>
      </div>

      {/* Progress bar */}
      {!isLocked && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
              {isComplete ? "Complete 🎉" : hasProgress ? `${module.progressPercent}% complete` : "Not started"}
            </span>
          </div>
          <div className="h-[3px] rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${module.progressPercent ?? 0}%`,
                background: `linear-gradient(to right, ${module.accentColor}80, ${module.accentColor})`,
              }} />
          </div>
        </div>
      )}

      {/* Sub-modules toggle */}
      {!isLocked && module.subModules.length > 0 && (
        <button
          className="px-4 py-2 border-t border-[hsl(var(--border))] flex items-center justify-between w-full text-left hover:bg-[hsl(var(--muted))] transition-colors"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          <span className="text-[11.5px] text-[hsl(var(--muted-foreground))]">{expanded ? "Hide" : "Show"} pages</span>
          <ChevronRight className={cn("h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200", expanded && "rotate-90")} />
        </button>
      )}
      {expanded && !isLocked && (
        <div className="px-3 pb-3 space-y-0.5">
          {module.subModules.map((sub) => (
            <button key={sub.id} onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors group/sub">
              <div className="flex-shrink-0">
                {sub.isCompleted
                  ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: module.accentColor }} />
                  : <div className="h-3.5 w-3.5 rounded-full border border-[hsl(var(--border))]" />}
              </div>
              <span className={cn("text-[12.5px] flex-1 text-left",
                sub.isCompleted ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]")}>
                {sub.title}
              </span>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                <Clock className="h-3 w-3" />{sub.estimatedMinutes}m
              </span>
            </button>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-4 mt-auto pt-2">
        {isLocked ? (
          <button onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--secondary))] transition-all text-[12.5px] font-semibold text-[hsl(var(--muted-foreground))]">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
            Unlock with Premium
          </button>
        ) : isComplete ? (
          <button onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12.5px] font-semibold transition-all"
            style={{ background: module.glowColor, color: module.accentColor, border: `1px solid ${module.accentColor}40` }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Review
          </button>
        ) : hasProgress ? (
          <button onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12.5px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: module.accentColor, boxShadow: `0 2px 12px ${module.accentColor}30` }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12.5px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: module.accentColor, boxShadow: `0 2px 12px ${module.accentColor}20` }}>
            Start →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Category URL aliases (from nav links) ────────────────────────────────────

const CATEGORY_ALIASES: Record<string, string> = {
  colregs: "COLREGs",
  navigation: "Navigation",
  meteorology: "Meteorology",
  cargo: "Cargo",
};

function resolveCategoryFromParam(param: string | null, categories: string[]): string | null {
  if (!param) return null;
  const alias = CATEGORY_ALIASES[param.toLowerCase()];
  if (alias && categories.includes(alias)) return alias;
  const match = categories.find((c) => c.toLowerCase() === param.toLowerCase());
  return match ?? null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface ModulesPageProps {
  userAccess?: AccessLevel;
  onModuleSelect?: (slug: string) => void;
  onUpgradeClick?: () => void;
}

export default function ModulesPage(props: ModulesPageProps) {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ModulesPageInner {...props} />
    </Suspense>
  );
}

function ModulesPageInner({
  userAccess: userAccessProp,
  onModuleSelect,
  onUpgradeClick,
}: ModulesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [resolvedAccess, setResolvedAccess] = useState<AccessLevel>(userAccessProp ?? "free");

  const [modules,           setModules]           = useState<Module[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [search,            setSearch]            = useState("");
  const [activeCategory,    setActiveCategory]    = useState("All");
  const [filter,            setFilter]            = useState<FilterState>("all");
  const [viewMode,          setViewMode]          = useState<ViewMode>("grid");
  const [showUpgradeModal,  setShowUpgradeModal]  = useState(false);

  const userAccess = userAccessProp ?? resolvedAccess;

  // ── Fetch from Supabase ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch modules + user progress in parallel
        const [modulesRes, sessionRes] = await Promise.all([
          supabase.from("modules").select("*").eq("hidden", false).order("category").order("title"),
          supabase.auth.getSession(),
        ]);

        if (modulesRes.error) throw modulesRes.error;

        const userId = sessionRes.data.session?.user?.id ?? null;

        if (!userAccessProp && userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle();
          const role = profile?.role;
          setResolvedAccess(role === "admin" ? "admin" : role === "premium" ? "premium" : "free");
        }

        // Pull section-level progress rows for this user (if logged in)
        // Shape: { module_id → Set<section_index> }
        let sectionProgressMap: Record<string, Set<number>> = {};
        if (userId) {
          const { data: sectionRows } = await supabase
            .from("user_section_progress")
            .select("module_id, section_index")
            .eq("user_id", userId);
          if (sectionRows) {
            for (const row of sectionRows) {
              if (!sectionProgressMap[row.module_id]) {
                sectionProgressMap[row.module_id] = new Set();
              }
              sectionProgressMap[row.module_id].add(row.section_index);
            }
          }
        }

        setModules(
          (modulesRes.data as SupabaseModule[]).map(row => {
            const m = normalise(row);
            const completedSections = sectionProgressMap[row.id] ?? new Set<number>();
            const totalSections = m.subModules.length;

            // Mark each sub-module (section) as completed
            m.subModules = m.subModules.map((sub, i) => ({
              ...sub,
              isCompleted: completedSections.has(i),
            }));

            // Derive progress percent from completed sections / total sections
            if (totalSections > 0 && completedSections.size > 0) {
              m.progressPercent = Math.round((completedSections.size / totalSections) * 100);
            } else {
              m.progressPercent = undefined;
            }

            return m;
          })
        );
      } catch (e: any) {
        setError(e.message || "Failed to load modules");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userAccessProp]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(modules.map((m) => m.category)))],
    [modules]
  );

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (!categoryParam || modules.length === 0) return;
    const resolved = resolveCategoryFromParam(categoryParam, categories.slice(1));
    if (resolved) setActiveCategory(resolved);
  }, [searchParams, modules, categories]);

  const filtered = useMemo(() => {
    return modules.filter((m) => {
      const matchesSearch   = !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = activeCategory === "All" || m.category === activeCategory;
      const isLocked        = m.isPremium && userAccess === "free";
      let matchesFilter = true;
      if (filter === "available")   matchesFilter = !isLocked;
      if (filter === "locked")      matchesFilter = isLocked;
      if (filter === "in-progress") matchesFilter = !isLocked && (m.progressPercent ?? 0) > 0 && m.progressPercent !== 100;
      if (filter === "completed")   matchesFilter = !isLocked && m.progressPercent === 100;
      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [modules, search, activeCategory, filter, userAccess]);

  const stats = useMemo(() => {
    const accessible = modules.filter((m) => !(m.isPremium && userAccess === "free"));
    return {
      accessible: accessible.length,
      inProgress: accessible.filter((m) => (m.progressPercent ?? 0) > 0 && m.progressPercent !== 100).length,
      completed:  accessible.filter((m) => m.progressPercent === 100).length,
      totalHours: Math.ceil(accessible.reduce((s, m) => s + m.estimatedHours, 0)),
    };
  }, [modules, userAccess]);

  const handleModuleSelect = useCallback((m: Module) => {
    if (onModuleSelect) { onModuleSelect(m.slug); return; }
    router.push(`/modules/${m.slug}`);
  }, [onModuleSelect, router]);

  const handleUpgrade = useCallback(() => {
    if (onUpgradeClick) { onUpgradeClick(); return; }
    setShowUpgradeModal(true);
  }, [onUpgradeClick]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] pb-16 lg:pb-0 font-sans">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* ── Header ── */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] sticky top-0 z-20">
        <div className="py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[1.5px] text-[hsl(var(--primary))] mb-1">Training Library</p>
              <h1 className="text-[22px] sm:text-[24px] font-bold leading-none text-[hsl(var(--foreground))]">
                Unit Modules
              </h1>
            </div>
            {userAccess === "free" && (
              <button onClick={handleUpgrade}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[12.5px] sm:text-[13px] font-semibold text-white flex-shrink-0 hover:opacity-90 transition-all"
                style={{ background: "hsl(var(--primary))" }}>
                <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Upgrade to </span>Premium
              </button>
            )}
          </div>

          {/* Stats strip */}
          {!loading && !error && (
            <div className="flex items-center gap-1.5 mt-4 text-[13px] text-[hsl(var(--muted-foreground))]">
              <span className="font-semibold text-[hsl(var(--foreground))]">{modules.length}</span> modules
              <span className="opacity-30">·</span>
              <span className="font-semibold text-[hsl(var(--foreground))]">{stats.accessible}</span> accessible
              {stats.inProgress > 0 && <>
                <span className="opacity-30">·</span>
                <span className="font-semibold text-[hsl(var(--foreground))]">{stats.inProgress}</span> in progress
              </>}
              {stats.completed > 0 && <>
                <span className="opacity-30">·</span>
                <span className="font-semibold text-[hsl(var(--foreground))]">{stats.completed}</span> completed
              </>}
              <span className="opacity-30">·</span>
              <span className="font-semibold text-[hsl(var(--foreground))]">{stats.totalHours}h</span> of content
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="py-4 sm:py-6">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 mb-5">
          {/* Search + controls row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <input type="text" placeholder="Search modules…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[13px] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:bg-[hsl(var(--background))] transition-all" />
            </div>

            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              {/* Status filter */}
              <select value={filter} onChange={(e) => setFilter(e.target.value as FilterState)}
                className="appearance-none pl-3 pr-3 py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[12px] text-[hsl(var(--muted-foreground))] focus:outline-none cursor-pointer transition-all hidden sm:block">
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="locked">Locked</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg p-0.5 gap-0.5">
                {(["grid", "list"] as ViewMode[]).map((v) => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={cn("p-1.5 rounded-md transition-all",
                      viewMode === v
                        ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                        : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]")}>
                    {v === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile filter row */}
          <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {(["all", "available", "in-progress", "completed", "locked"] as FilterState[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-all border flex-shrink-0",
                  filter === f
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-transparent"
                    : "bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]"
                )}>
                {f === "all" ? "All" : f === "in-progress" ? "In progress" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Category pills — scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-[12px] font-medium transition-all border whitespace-nowrap flex-shrink-0",
                  activeCategory === cat
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-transparent"
                    : "bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground)/0.3)]"
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
            <span className="text-[14px]">Loading modules…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Failed to load modules</p>
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">{error}</p>
          </div>
        )}

        {/* Modules grid/list */}
        {!loading && !error && (
          <>
            {(search || activeCategory !== "All" || filter !== "all") && (
              <div className="mb-4 text-[13px] text-[hsl(var(--muted-foreground))]">
                {filtered.length} module{filtered.length !== 1 ? "s" : ""} found
                {search && <span> for "<span className="text-[hsl(var(--primary))]">{search}</span>"</span>}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-[18px] font-bold text-[hsl(var(--foreground))] mb-2">No modules found</h3>
                <p className="text-[14px] text-[hsl(var(--muted-foreground))]">Try adjusting your search or filters</p>
                <button onClick={() => { setSearch(""); setActiveCategory("All"); setFilter("all"); }}
                  className="mt-4 px-4 py-2 rounded-xl text-[13px] font-medium text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--accent))] transition-all">
                  Clear filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((module, i) => (
                  <ModuleCard key={module.id} module={module} userAccess={userAccess}
                    viewMode="grid" onSelect={handleModuleSelect} onUpgrade={handleUpgrade} animDelay={i * 50} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((module, i) => (
                  <ModuleCard key={module.id} module={module} userAccess={userAccess}
                    viewMode="list" onSelect={handleModuleSelect} onUpgrade={handleUpgrade} animDelay={i * 30} />
                ))}
              </div>
            )}

            {/* Upgrade banner */}
            {userAccess === "free" && modules.some((m) => m.isPremium) && (
              <div className="mt-8 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 border border-[hsl(var(--border))]"
                style={{ background: "hsl(var(--muted))" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[hsl(var(--accent))]">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-0.5">
                    Unlock all {modules.filter((m) => m.isPremium).length} premium modules
                  </h3>
                  <p className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
                    Full access to every module, quiz, simulator and resource.
                  </p>
                </div>
                <button onClick={handleUpgrade}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white flex-shrink-0 hover:opacity-90 transition-all"
                  style={{ background: "hsl(var(--primary))" }}>
                  <Sparkles className="h-4 w-4" /> Upgrade to Premium
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Upgrade modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowUpgradeModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-8 border relative"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--primary)/0.25)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--accent))] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-[hsl(var(--primary))]" />
              </div>
              <h2 className="text-[22px] font-bold text-[hsl(var(--foreground))] mb-2">Go Premium</h2>
              <p className="text-[14px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Unlock every module, quiz, and simulator on CadetMate and ace your OOW oral.
              </p>
            </div>
            <div className="space-y-2.5 mb-6">
              {["All Unit Modules (COLREGS, Nav, GMDSS & more)", "Interactive quizzes with worked solutions", "Bridge Emergency Simulator (coming soon)", "Progress tracking & certificates"].map((f) => (
                <div key={f} className="flex items-center gap-3 text-[13.5px] text-[hsl(var(--foreground))]">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))] flex-shrink-0" />{f}
                </div>
              ))}
            </div>
            <button onClick={() => { setShowUpgradeModal(false); router.push("/store"); }}
              className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))" }}>
              View Premium Plans →
            </button>
            <button onClick={() => setShowUpgradeModal(false)}
              className="w-full mt-2.5 py-2.5 rounded-xl text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}