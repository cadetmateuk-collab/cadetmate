import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Users, CheckCircle, Clock, Trophy, ArrowRight, Linkedin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CadetMate | UK Deck Cadet Maritime Training Platform',
  description: 'The training platform built for UK deck cadets. Interactive modules, COLREGS, watchkeeping, STCW revision and more. Start free today.',
  keywords: ['deck cadet training UK', 'maritime cadet app', 'STCW revision', 'COLREGS training', 'OOW cadet', 'nautical science'],
  openGraph: {
    title: 'CadetMate | UK Deck Cadet Maritime Training',
    description: 'Interactive training modules for UK deck cadets. COLREGS, watchkeeping, signals and more.',
    url: 'https://cadetmate.com/home',
    siteName: 'CadetMate',
    images: [{ url: '/images/CadetMateLogoBlueBGQWhiteFG.svg', alt: 'CadetMate' }],
    type: 'website',
  },
}

const FEATURES = [
  'Interactive Modules',
  'Expert Content',
  'Progress Tracking',
  'Quiz System',
  'Certificates',
  'Community',
] as const

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default async function HomePage() {
  const supabase = await createClient()

  const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [totalUsersResult, activeUsersResult, topTimeResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_statistics')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity_at', new Date(Date.now() - 3600000).toISOString()),
    supabase
      .from('user_statistics')
      .select('total_time_seconds, profiles!user_statistics_user_id_fkey (full_name)')
      .gte('last_activity_date', weekAgoDate)
      .order('total_time_seconds', { ascending: false })
      .limit(3),
  ])

  const totalUsers = totalUsersResult.count || 0
  const activeUsers = activeUsersResult.count || 0
  const topTimeSpent =
    topTimeResult.data?.map((row: any) => ({
      full_name: row.profiles?.full_name ?? 'Anonymous',
      total_time_seconds: row.total_time_seconds,
    })) || []

  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="h-full flex">

        {/* Hero Section */}
        <section
          className="w-[80%] flex items-center justify-center p-12 relative"
          aria-label="Hero section"
        >
          <div className="max-w-5xl w-full grid grid-cols-[1.5fr_0.5fr] gap-6 items-center relative">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full mb-6 text-sm font-medium">
                Maritime Training Platform
              </div>

              <h1 className="text-6xl font-semibold mb-6 leading-tight">
                Master Your Maritime Career
              </h1>

              <p className="text-muted-foreground mb-8 text-xl leading-relaxed">
                Comprehensive training modules, interactive quizzes, and expert guidance to help
                you excel in your maritime journey.
              </p>

              <nav className="flex gap-4 mb-12" aria-label="Primary actions">
                <a
                  href="/auth"
                  className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 text-base inline-flex items-center"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                </a>
                <a
                  href="/simulator"
                  className="px-8 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-all duration-200 text-base"
                >
                  Watch Demo
                </a>
              </nav>

              <section className="pt-8 border-t border-border">
                <h2 className="font-semibold mb-5 text-lg">What We Include</h2>
                <div className="grid grid-cols-2 gap-4">
                  {FEATURES.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
                      <span className="text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="relative -mr-16 flex justify-center items-center">
              <div className="w-[clamp(300px,35vw,500px)] h-auto">
                <video
                  src="/images/captain-wave.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside
          className="w-[20%] border-l border-border flex flex-col bg-muted/30"
          aria-label="Statistics and updates"
        >
          {/* Stats Bar */}
          <section className="flex items-center justify-between gap-6 px-6 py-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-semibold">{totalUsers}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="text-sm font-semibold">{activeUsers}</span>
            </div>
          </section>

          {/* Top This Week */}
          <section className="p-6 border-b border-border bg-background">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="font-semibold">Top This Week</h2>
            </div>
            <div className="space-y-3">
              {topTimeSpent.length > 0 ? (
                topTimeSpent.map((user, idx) => (
                  <div key={`${user.full_name}-${idx}`} className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                        idx === 0 ? 'bg-primary text-white' : 'bg-muted text-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {user.full_name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(user.total_time_seconds || 0)}
                      </div>
                    </div>
                    {idx === 0 && (
                      <Trophy className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No activity this week
                </div>
              )}
            </div>
          </section>

          {/* LinkedIn Feed */}
          <section className="flex-1 p-6 flex flex-col min-h-0 bg-background">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Latest Update</h2>
              <a
                href="https://www.linkedin.com/company/cadetmate/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                aria-label="Follow CadetMate on LinkedIn"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                Follow
              </a>
            </div>
            <div className="flex-1 border border-border rounded-lg overflow-hidden bg-white">
              <iframe
                src="https://www.linkedin.com/embed/feed/update/urn:li:share:7423140746456825856"
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="CadetMate LinkedIn updates and news"
                loading="lazy"
              />
            </div>
          </section>
        </aside>

      </div>
    </div>
  )
}