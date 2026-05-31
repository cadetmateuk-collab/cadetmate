'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  HelpCircle, Pin, ShipWheel, FileText, BookOpen,
  User, BarChart2, Sparkles, Anchor, MessageCircle, Calendar,
  WalletCards,
} from 'lucide-react'
import AdminQuestionsTab      from '@/components/AdminQuestionsTab'
import AdminNoticeboardTab    from '@/components/AdminNoticeboardTab'
import AdminBlogTab           from '@/components/AdminBlogTab'
import AdminModuleManagementTab from '@/components/AdminModuleManagementTab'
import AdminSeaSurvivalTab    from '@/components/AdminSeaSurvivalTab'
import AdminUsersTab          from '@/components/AdminUsersTab'
import AdminAnalyticsTab      from '@/components/AdminAnalyticsTab'
import AdminSupportTab        from '@/components/AdminSupportTab'
import AdminTRBTasksTab       from '@/components/AdminTRBTasksTab'
import AdminFlashcardsTab     from '@/components/AdminFlashcardsTab'

// ─── Tab groups ───────────────────────────────────────────────
const TAB_GROUPS = [
  {
    label: 'Overview / Support',
    tabs: [
      { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} />, component: AdminAnalyticsTab },
      { id: 'users', label: 'Users', icon: <User size={15} />, component: AdminUsersTab },
      { id: 'support', label: 'Support', icon: <MessageCircle size={15} />, component: AdminSupportTab },
    ],
  },
  {
    label: 'Homepage / Free Content',
    tabs: [
      { id: 'noticeboard', label: 'Noticeboard', icon: <Pin size={15} />, component: AdminNoticeboardTab },
      { id: 'questions', label: 'Questions', icon: <HelpCircle size={15} />, component: AdminQuestionsTab },
      { id: 'blog', label: 'Free Content', icon: <Sparkles size={15} />, component: AdminBlogTab },
    ],
  },
  {
    label: 'Paid Content',
    tabs: [
      { id: 'modules', label: 'Modules', icon: <BookOpen size={15} />, component: AdminModuleManagementTab },
      { id: 'trb', label: 'TRB Tasks', icon: <FileText size={15} />, component: AdminTRBTasksTab },
      { id: 'sea-survival', label: 'Sea Survival', icon: <Anchor size={15} />, component: AdminSeaSurvivalTab },
      { id: 'flashcards', label: 'Flashcards', icon: <WalletCards size={15} />, component: AdminFlashcardsTab },
    ],
  },
]

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs)

export default function AdminPage() {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_tab') ?? ALL_TABS[0].id
    }
    return ALL_TABS[0].id
  })

  const [activeGroup, setActiveGroup] = useState(() => TAB_GROUPS[0].label)

  const [adminName, setAdminName] = useState<string | null>(null)

  function handleTabChange(id: string) {
    setActiveTab(id)
    if (typeof window !== 'undefined') localStorage.setItem('admin_tab', id)

    // sync group when tab changes
    const foundGroup = TAB_GROUPS.find(g => g.tabs.some(t => t.id === id))
    if (foundGroup) setActiveGroup(foundGroup.label)
  }

  function handleGroupChange(label: string) {
    setActiveGroup(label)

    const group = TAB_GROUPS.find(g => g.label === label)
    if (group) {
      const firstTab = group.tabs[0]
      setActiveTab(firstTab.id)
      if (typeof window !== 'undefined') localStorage.setItem('admin_tab', firstTab.id)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          setAdminName(profile?.full_name ?? profile?.email ?? data.user.email ?? null)
        })
    })
  }, [])

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  const ActiveComponent = ALL_TABS.find(t => t.id === activeTab)?.component ?? ALL_TABS[0].component

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.05); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }

        .adm-anim-1 { animation: fadeUp 0.4s ease both 0.04s; }
        .adm-anim-2 { animation: fadeUp 0.4s ease both 0.10s; }
        .adm-anim-3 { animation: fadeUp 0.4s ease both 0.17s; }

        .adm-page {
          min-height: 100dvh;
          background-color: hsl(var(--background));
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: clip; /* clip doesn't create a stacking context; hidden does */
        }

        .adm-dot-grid {
          pointer-events: none; position: fixed; inset: 0;
          background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 20%, black 40%, transparent 100%);
          z-index: -1;
        }

        .adm-glow {
          pointer-events: none; position: fixed;
          top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 66%);
          z-index: -1;
        }

        .adm-noise {
          pointer-events: none; position: fixed; inset: 0;
          opacity: 0.025; z-index: -1;
        }

        .adm-header {
          position: sticky; top: 0; z-index: 40;
          background: hsl(var(--background) / 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid hsl(var(--border));
        }

        .adm-topbar {
          display: flex;
          align-items: center;
          height: 58px;
          padding: 0 2rem;
          gap: 1rem;
        }

        .adm-brand {
          display: flex; align-items: center; gap: 0.625rem;
        }

        .adm-brand-icon {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          background: hsl(var(--primary) / 0.1);
          border-radius: 8px;
          color: hsl(var(--primary));
        }

        .adm-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .adm-brand-badge {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.1);
          border: 1px solid hsl(var(--primary) / 0.2);
          padding: 2px 7px;
          border-radius: 999px;
        }

        .adm-spacer { flex: 1; }

        .adm-meta {
          display: flex; align-items: center; gap: 1rem;
        }

        /* ── NEW: GROUP HEADER ROW ── */
        .adm-group-row {
          display: flex;
          padding: 0 1.75rem;
          gap: 2rem;
          border-bottom: 1px solid hsl(var(--border));
        }

        .adm-group-title {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground) / 0.6);
          padding: 0.5rem 0;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .adm-group-title.active {
          color: hsl(var(--primary));
        }

        /* ── Tab bar ── */
        .adm-tabbar {
          display: flex;
          padding: 0 1.75rem;
          overflow-x: auto;
        }

        .adm-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0 0.875rem;
          height: 42px;
          margin-bottom: -1px;
          font-size: 0.8125rem;
          color: hsl(var(--muted-foreground));
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }

        .adm-tab.active {
          color: hsl(var(--primary));
          border-bottom-color: hsl(var(--primary));
        }

        .adm-content {
          position: relative;
          max-width: 980px;
          margin: 0 auto;
          padding: 2.25rem 2.5rem 6rem;
        }
          /* GLOBAL MODAL LAYER */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(6px);
  z-index: 9998;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;

  background: hsl(var(--background));
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 320px;
}
      `}</style>

      <div className="adm-page">
        <div className="adm-dot-grid" />
        <div className="adm-glow" />
        <div className="adm-noise" />

        <header className="adm-header">

          <div className="adm-topbar">
            <div className="adm-brand">
              <span className="adm-brand-badge">CadetMate Admin</span>
            </div>

            <div className="adm-spacer" />

            <div className="adm-meta">
              <div>{today}</div>
              {adminName && <div>{adminName}</div>}
            </div>
          </div>

          {/* GROUP ROW */}
          <div className="adm-group-row">
            {TAB_GROUPS.map(group => (
              <button
                key={group.label}
                type="button"
                onClick={() => handleGroupChange(group.label)}
                className={`adm-group-title${activeGroup === group.label ? ' active' : ''}`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {/* TAB ROW */}
          <div className="adm-tabbar">
            {TAB_GROUPS.find(g => g.label === activeGroup)?.tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`adm-tab${activeTab === tab.id ? ' active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

        </header>

        <div className="adm-content adm-anim-2">
          <div className="adm-anim-3">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </>
  )
}