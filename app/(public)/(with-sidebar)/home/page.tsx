import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  Users, CheckCircle, ArrowRight,
  Zap, BookOpen, BarChart2, Star, MessageSquare,
  ShipWheel, Activity, Pin, HelpCircle,
} from 'lucide-react'
import PortClocks from '@/components/PortClocks'
import QuestionOfDay from '@/components/QuestionOfDay'

export const metadata: Metadata = {
  title: 'CadetMate | UK Deck Cadet Maritime Training Platform',
  description:
    'The training platform built for UK deck cadets. Interactive modules, COLREGS, watchkeeping, STCW revision and more. Start free today.',
  keywords: ['deck cadet training UK', 'maritime cadet app', 'STCW revision', 'COLREGS training', 'OOW cadet', 'nautical science'],
  openGraph: {
    title: 'CadetMate | UK Deck Cadet Maritime Training',
    description: 'Interactive training modules for UK deck cadets. COLREGS, watchkeeping, signals and more.',
    url: 'https://cadetmate.co.uk/home',
    siteName: 'CadetMate',
    images: [{ url: '/images/CadetMateLogoBlueBGQWhiteFG.svg', alt: 'CadetMate' }],
    type: 'website',
  },
}

const FEATURES = [
  { label: 'Interactive Modules', icon: BookOpen,      description: 'Hands-on lessons built for cadets' },
  { label: 'Expert Content',      icon: Star,          description: 'Written by MCA-qualified officers' },
  { label: 'Progress Tracking',   icon: BarChart2,     description: 'See exactly where you stand' },
  { label: 'Quiz System',         icon: CheckCircle,   description: 'Test yourself at every stage' },
  { label: 'Simulators',          icon: ShipWheel,     description: 'Practise in realistic simulators' },
  { label: 'Community',           icon: MessageSquare, description: 'Learn alongside fellow cadets' },
] as const

// Placeholder noticeboard — replace with Supabase pull once admin table is ready

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function HomePage() {
  const supabase = await createClient()

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const todayKey = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"

  const [totalUsersResult, activeUsersResult, recentActivityResult, questionResult, noticesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', twoHoursAgo),

    // Most recent 5 section completions
    supabase
      .from('user_section_progress')
      .select('completed_at, section_index, user_id, module_id, modules!user_section_progress_module_id_fkey (title)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),

    // Today's question
    supabase
      .from('daily_questions')
      .select('id, question, options, correct_answer, explanation')
      .eq('question_date', todayKey)
      .maybeSingle(),

    // Most recent 3 active notices for homepage
    supabase
      .from('notices')
      .select('id, text, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const totalUsers  = totalUsersResult.count || 0
  const activeUsers = activeUsersResult.count || 0
  const rawActivity = (recentActivityResult.data ?? []) as any[]

  // Fetch display names for the users in the activity feed
  const activityUserIds = [...new Set(rawActivity.map(r => r.user_id))]
  const profilesResult = activityUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', activityUserIds)
    : { data: [] }
  const profileMap = new Map((profilesResult.data ?? []).map((p: any) => [p.id, p.full_name]))
  const recentActivity = rawActivity.map(r => {
    const raw = profileMap.get(r.user_id)
    const display_name = (raw && typeof raw === 'string' && raw.trim()) ? raw.trim() : null
    return { ...r, display_name }
  })
  const todayQ         = questionResult.data as {
    id: string
    question: string
    options: string[]
    correct_answer: string
    explanation?: string | null
  } | null
  const notices        = (noticesResult.data ?? []) as { id: string; text: string; created_at: string }[]

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulseDot {
          0%,100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.8); opacity: 0.3; }
        }

        .anim-eyebrow { animation: fadeUp 0.45s ease both 0.05s; }
        .anim-h1      { animation: fadeUp 0.45s ease both 0.15s; }
        .anim-sub     { animation: fadeUp 0.45s ease both 0.25s; }
        .anim-ctas    { animation: fadeUp 0.45s ease both 0.35s; }
        .anim-video   { animation: fadeIn 0.65s ease both 0.20s; }
        .anim-footer  { animation: fadeUp 0.40s ease both 0.50s; }

        .feat-card { animation: fadeUp 0.4s ease both; }
        .feat-card:nth-child(1) { animation-delay: 0.44s; }
        .feat-card:nth-child(2) { animation-delay: 0.50s; }
        .feat-card:nth-child(3) { animation-delay: 0.56s; }
        .feat-card:nth-child(4) { animation-delay: 0.62s; }
        .feat-card:nth-child(5) { animation-delay: 0.68s; }
        .feat-card:nth-child(6) { animation-delay: 0.74s; }
        .feat-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .feat-card:hover {
          transform: translateY(-3px);
          border-color: hsl(var(--primary) / 0.35);
          box-shadow: 0 8px 28px hsl(var(--primary) / 0.09);
        }
        .btn-primary { transition: transform 0.12s ease, box-shadow 0.15s ease; }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px hsl(var(--primary) / 0.35);
        }
        .btn-ghost { transition: transform 0.12s ease, background 0.15s ease; }
        .btn-ghost:hover { transform: translateY(-2px); background: hsl(var(--muted)); }
        .ping-ring { animation: pulseDot 1.8s ease-in-out infinite; }

        /* SVG noise texture — inline data URI, no external file needed */
        .hero-noise {
          position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
          opacity: 0.025;
          mix-blend-mode: multiply;
        }

        .hero-h1-text {
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.75) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: url(#text-noise);
        }
        .hero-h1-text .text-primary {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @media (max-width: 768px) {
          /* Reset the grid layout to simple flex column */
          .page-root {
            height: auto !important;
            min-height: 100dvh !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            grid-template-columns: none !important;
            grid-template-rows: none !important;
          }
          .hero-section {
            flex: 1 !important;
            display: flex !important;
            align-items: flex-start !important;
            padding: 1.75rem 1.25rem 2rem !important;
            overflow: visible !important;
            grid-column: unset !important;
            grid-row: unset !important;
            min-height: unset !important;
          }
          .captain-wrap { display: none !important; }
          .sidebar      { display: none !important; }
          .hero-grid    { grid-template-columns: 1fr !important; gap: 0 !important; width: 100% !important; }
          .hero-h1-text { font-size: 2.4rem !important; }
          .hero-sub-text { font-size: 0.95rem !important; margin-bottom: 1.5rem !important; }
          .feat-grid    { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .footer-bar   {
            padding: 0.75rem 1.25rem !important;
            gap: 0.75rem !important;
            flex-wrap: wrap !important;
            grid-column: unset !important;
          }
          /* hide everything in footer on mobile except active */
          .footer-users     { display: none !important; }
          .port-clocks-wrap { display: none !important; }
          /* hide active from footer too — shown in hero */
          .footer-active    { display: none !important; }
          .footer-divider   { display: none !important; }
          .mobile-stats     { display: flex !important; }
          /* tighter eyebrow */
          .anim-eyebrow { margin-bottom: 0.875rem !important; }
          /* CTA full width */
          .anim-ctas   { width: 100% !important; margin-bottom: 1.5rem !important; }
          .anim-ctas a { width: 100% !important; justify-content: center !important; }
        }
        @media (max-width: 480px) {
          .hero-h1-text { font-size: 2rem !important; }
          .hero-section { padding: 1.5rem 1rem 1.75rem !important; }
        }
        .mobile-stats { display: none; }
      `}</style>

      <div className="page-root bg-background" style={{ height: '100dvh', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 18rem', gridTemplateRows: '1fr auto' }}>

          {/* ── Hero ── */}
          <section
            className="hero-section flex-1 flex items-center px-16 py-10 relative overflow-hidden"
            style={{ gridColumn: '1', gridRow: '1', minHeight: 0 }}
            aria-label="Hero"
          >
            {/* Dot grid background */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--foreground) / 0.08) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
              }}
            />
            {/* Noise overlay */}
            <div className="hero-noise" aria-hidden="true" />
            {/* SVG filter for text noise */}
            <svg width="0" height="0" className="absolute" aria-hidden="true">
              <defs>
                <filter id="text-noise" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
            </svg>
            <div
              className="pointer-events-none absolute -top-48 -left-48 w-[800px] h-[800px] rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.065) 0%, transparent 66%)' }}
            />

            <div
              className="hero-grid max-w-6xl w-full grid items-center"
              style={{ gridTemplateColumns: '1fr auto', gap: '2.5rem' }}
            >
              <div className="flex flex-col">

                <div className="anim-eyebrow inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase mb-4">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  UK Maritime Training
                </div>

                <h1 className="hero-h1-text anim-h1 font-bold leading-[1.05] tracking-tight mb-4" style={{ fontSize: '4.5rem' }}>
                  Master Your
                  <br />
                  <span className="text-primary">Maritime</span> Career
                </h1>

                <p className="hero-sub-text anim-sub text-muted-foreground leading-relaxed max-w-xl mb-5" style={{ fontSize: '1.2rem' }}>
                  Everything a UK deck cadet needs — comprehensive modules,
                  expert quizzes, and real progress you can track.
                </p>

                {/* Mobile-only quick stats */}
                <div className="mobile-stats items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs text-muted-foreground"><span className="font-bold text-primary tabular-nums">{activeUsers}</span> active now</span>
                  </div>
                </div>

                <nav className="anim-ctas flex flex-wrap items-center gap-3 mb-6" aria-label="Primary actions">
                  <a href="/auth" className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </nav>

                <div className="feat-grid grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} role="list" aria-label="Platform features">
                  {FEATURES.map(({ label, icon: Icon, description }) => (
                    <div key={label} role="listitem" className="feat-card flex flex-col gap-2.5 rounded-xl border border-border bg-white dark:bg-background px-4 py-3.5 cursor-default">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold leading-tight">{label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="captain-wrap anim-video flex-shrink-0 ml-auto" style={{ width: 'clamp(300px, 30vw, 500px)', transform: 'translateX(2rem)' }}>
                <video src="/images/captain-wave.webm" autoPlay loop muted playsInline className="w-full h-auto object-contain" />
              </div>
            </div>
          </section>

          {/* ── Sidebar ── spans both grid rows, full height ── */}
          <aside
            className="sidebar border-l border-border flex flex-col bg-background overflow-y-auto"
            style={{ gridColumn: '2', gridRow: '1 / 3' }}
            aria-label="Activity and info"
          >

            {/* 1 · Recent Activity */}
            <section className="sidebar-section px-5 py-4" aria-label="Recent activity">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Recent Activity</p>
              </div>
              <div className="space-y-2.5">
                {recentActivity.length > 0 ? recentActivity.slice(0, 3).map((row, idx) => {
                  const displayName: string = row.display_name || ''
                  const firstName = displayName.split(' ')[0] || 'Cadet'
                  const avatarText = firstName.slice(0, 3).toUpperCase()
                  const moduleTitle: string = row.modules?.title || 'a module'
                  const sectionNum: number = (row.section_index ?? 0) + 1
                  return (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-primary leading-none">{avatarText}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">
                          <span className="font-semibold">{firstName}</span>
                          <span className="text-muted-foreground"> completed section {sectionNum} of </span>
                          <span className="font-medium">{moduleTitle}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{timeAgo(row.completed_at)}</p>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-xs text-muted-foreground/60 py-1">No recent activity yet</p>
                )}
              </div>
            </section>

            {/* 2 · Cadet Noticeboard */}
            <section className="sidebar-section px-5 py-4" aria-label="Cadet noticeboard">
              <div className="flex items-center gap-2 mb-3">
                <Pin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Noticeboard</p>
              </div>
              <div className="space-y-2">
                {notices.length > 0 ? notices.map(notice => (
                  <div key={notice.id} className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                    <p className="text-xs leading-snug">{notice.text}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(notice.created_at)}</p>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground/60 py-1">No notices right now.</p>
                )}
              </div>
            </section>

            {/* 3 · Question of the Day */}
            <section className="sidebar-section px-5 py-4" aria-label="Question of the day">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Question of the Day</p>
              </div>
              {todayQ ? (
                <QuestionOfDay question={todayQ} todayKey={todayKey} />
              ) : (
                <p className="text-xs text-muted-foreground/60 py-1">No question set for today yet.</p>
              )}
            </section>

            {/* Copyright — pinned to sidebar bottom */}
            <div className="mt-auto px-5 py-4">
              <p className="text-xs font-medium text-center" style={{ color: '#b0b0b0' }}>© CadetMate 2026. All rights reserved.</p>
            </div>

          </aside>

        {/* ── Footer stats bar — only under hero ── */}
        <footer className="footer-bar anim-footer border-t border-border bg-background/80 backdrop-blur-sm px-8 py-3 flex items-center gap-6" style={{ gridColumn: '1' }} aria-label="Platform statistics">
          <div className="footer-users flex items-center gap-2.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground font-medium">Total users</span>
            <span className="text-sm font-bold tabular-nums">{totalUsers}</span>
          </div>
          <div className="footer-users footer-divider h-3.5 w-px bg-border" aria-hidden="true" />
          <div className="footer-active flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-xs text-muted-foreground font-medium">Active</span>
            <span className="text-sm font-bold tabular-nums text-primary">{activeUsers}</span>
          </div>
          <div className="footer-divider h-3.5 w-px bg-border" aria-hidden="true" />
          <div className="flex-1" />
          <div className="port-clocks-wrap">
            <PortClocks />
          </div>
        </footer>
      </div>
    </>
  )
}