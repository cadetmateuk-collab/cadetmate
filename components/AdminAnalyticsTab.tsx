'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Crown, Activity, Clock, RefreshCw, TrendingUp } from 'lucide-react'

const supabase = createClient()

const C = {
  bg:           '#ffffff',
  fg:           '#000000',
  primary:      '#2966f4',
  primaryLight: '#eef2fe',
  muted:        '#f5f5f5',
  mutedFg:      '#737373',
  border:       '#ededed',
  green:        '#16a34a',
  greenLight:   '#f0fdf4',
  amber:        '#d97706',
  amberLight:   '#fffbeb',
  purple:       '#7c3aed',
  purpleLight:  '#f5f3ff',
}

interface Stats {
  totalUsers:    number
  premiumUsers:  number
  basicUsers:    number
  freeUsers:     number
  activeToday:   number
  activeWeek:    number
  activeMonth:   number
  newThisWeek:   number
  newThisMonth:  number
}

// ── Sparkline (last 7 days signups) ──────────────────────────────────────────
interface DayStat { date: string; count: number }

function Sparkline({ data }: { data: DayStat[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 120
  const h = 36
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (d.count / max) * (h - 4)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={C.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (d.count / max) * (h - 4)
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill={C.primary} />
        )
      })}
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, accent, sub,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  accent: { bg: string; color: string }
  sub?: string
}) {
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: accent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent.color, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: C.fg, margin: '0 0 2px' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: '12px', fontWeight: 600, color: C.mutedFg, margin: 0 }}>{label}</p>
      {sub && <p style={{ fontSize: '11px', color: C.mutedFg, margin: '4px 0 0', opacity: 0.7 }}>{sub}</p>}
    </div>
  )
}

// ── Role bar ─────────────────────────────────────────────────────────────────
function RoleBar({ stats }: { stats: Stats }) {
  const total = stats.totalUsers || 1
  const segments = [
    { label: 'Premium', count: stats.premiumUsers, color: C.purple },
    { label: 'Basic',   count: stats.basicUsers,   color: C.primary },
    { label: 'Free',    count: stats.freeUsers,    color: C.border },
  ]

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ padding: '7px', borderRadius: '8px', background: C.primaryLight, display: 'flex' }}>
          <TrendingUp size={14} color={C.primary} />
        </div>
        <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: C.fg }}>User Breakdown</p>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '10px', marginBottom: '14px', gap: '2px' }}>
        {segments.map(s => (
          <div key={s.label} style={{
            flex: s.count / total,
            background: s.color,
            minWidth: s.count > 0 ? '2px' : '0',
            transition: 'flex 0.4s ease',
          }} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.mutedFg }}>
              {s.label}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.fg }}>{s.count}</span>
            <span style={{ fontSize: '10px', color: C.mutedFg }}>
              ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Signups chart ─────────────────────────────────────────────────────────────
function SignupsChart({ data }: { data: DayStat[] }) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ padding: '7px', borderRadius: '8px', background: C.primaryLight, display: 'flex' }}>
          <TrendingUp size={14} color={C.primary} />
        </div>
        <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: C.fg }}>New Signups — Last 14 Days</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
            <div
              title={`${d.date}: ${d.count} signup${d.count !== 1 ? 's' : ''}`}
              style={{
                width: '100%',
                height: max > 0 ? `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%` : '0%',
                background: d.count > 0 ? C.primary : C.border,
                borderRadius: '4px 4px 2px 2px',
                transition: 'height 0.3s ease',
                cursor: 'default',
                minHeight: d.count > 0 ? '4px' : '0',
                opacity: i === data.length - 1 ? 1 : 0.65 + (i / data.length) * 0.35,
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ fontSize: '10px', color: C.mutedFg }}>
          {data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
        </span>
        <span style={{ fontSize: '10px', color: C.mutedFg }}>Today</span>
      </div>
    </div>
  )
}

// ── Main tab ─────────────────────────────────────────────────────────────────
export default function AdminAnalyticsTab() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [signups, setSignups]   = useState<DayStat[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('role, created_at, last_seen_at')

      if (pErr) throw new Error(pErr.message)
      if (!profiles) throw new Error('No data returned')

      const now        = new Date()
      const weekAgo    = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
      const monthAgo   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const todayStart = new Date(now.toISOString().slice(0, 10))

      const s: Stats = {
        totalUsers:   profiles.length,
        premiumUsers: profiles.filter(p => p.role === 'premium').length,
        basicUsers:   profiles.filter(p => p.role === 'basic').length,
        freeUsers:    profiles.filter(p => !p.role || p.role === 'free').length,
        activeToday:  profiles.filter(p => p.last_seen_at && new Date(p.last_seen_at) >= todayStart).length,
        activeWeek:   profiles.filter(p => p.last_seen_at && new Date(p.last_seen_at) >= weekAgo).length,
        activeMonth:  profiles.filter(p => p.last_seen_at && new Date(p.last_seen_at) >= monthAgo).length,
        newThisWeek:  profiles.filter(p => p.created_at  && new Date(p.created_at)  >= weekAgo).length,
        newThisMonth: profiles.filter(p => p.created_at  && new Date(p.created_at)  >= monthAgo).length,
      }

      setStats(s)

      // Build 14-day signup chart
      const days: DayStat[] = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().slice(0, 10)
        days.push({
          date:  key,
          count: profiles.filter(p => p.created_at?.slice(0, 10) === key).length,
        })
      }
      setSignups(days)
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e.message)
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: C.primaryLight, display: 'flex' }}>
            <Activity size={16} color={C.primary} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: C.fg }}>Analytics</h2>
            <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          title="Refresh"
          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: C.mutedFg, display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = C.muted}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: '#dc2626', textAlign: 'center', padding: '32px 0' }}>{error}</p>
      )}

      {loading && !stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '110px', borderRadius: C.radius, background: C.muted, animation: 'pulse 1.5s ease infinite' }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      )}

      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Top stat cards — 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={<Users size={16} />}
              accent={{ bg: C.primaryLight, color: C.primary }}
              sub={`+${stats.newThisMonth} this month`}
            />
            <StatCard
              label="Premium Users"
              value={stats.premiumUsers}
              icon={<Crown size={16} />}
              accent={{ bg: C.purpleLight, color: C.purple }}
              sub={stats.totalUsers > 0 ? `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% of total` : undefined}
            />
            <StatCard
              label="Active This Week"
              value={stats.activeWeek}
              icon={<Activity size={16} />}
              accent={{ bg: C.greenLight, color: C.green }}
              sub={`${stats.activeToday} active today`}
            />
            <StatCard
              label="New This Week"
              value={stats.newThisWeek}
              icon={<Clock size={16} />}
              accent={{ bg: C.amberLight, color: C.amber }}
              sub={`+${stats.newThisMonth} this month`}
            />
          </div>

          {/* Role breakdown bar */}
          <RoleBar stats={stats} />

          {/* 14-day signups chart */}
          <SignupsChart data={signups} />

        </div>
      )}
    </div>
  )
}