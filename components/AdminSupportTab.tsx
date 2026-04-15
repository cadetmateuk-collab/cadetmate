'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, RefreshCw, ChevronDown } from 'lucide-react'

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
  red:          '#dc2626',
  redLight:     '#fef2f2',
  radius:       '10px',
}

type TicketStatus = 'open' | 'in_progress' | 'resolved'

interface Ticket {
  id:         string
  user_id:    string
  email:      string
  subject:    string
  message:    string
  status:     TicketStatus
  created_at: string
}

const STATUS_STYLES: Record<TicketStatus, { bg: string; color: string; label: string }> = {
  open:        { bg: C.redLight,   color: C.red,    label: 'Open' },
  in_progress: { bg: C.amberLight, color: C.amber,  label: 'In Progress' },
  resolved:    { bg: C.greenLight, color: C.green,  label: 'Resolved' },
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function StatusSelector({ ticketId, current, ticketEmail, ticketSubject, onUpdate }: { ticketId: string; current: TicketStatus; ticketEmail: string; ticketSubject: string; onUpdate: (id: string, s: TicketStatus) => void }) {
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)

  async function select(status: TicketStatus) {
    setOpen(false)
    if (status === current) return
    setSaving(true)

    // 1. Update DB
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId)

    // 2. Email user about status change (fire and forget)
    fetch('/api/send-ticket-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:      'status_update',
        userEmail: ticketEmail,
        subject:   ticketSubject,
        ticketId,
        newStatus: status,
      }),
    }).catch(err => console.error('Status update email failed:', err))

    setSaving(false)
    onUpdate(ticketId, status)
  }

  const s = STATUS_STYLES[current]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.color}33`, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
        {saving ? '…' : s.label}
        <ChevronDown size={9} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 20, background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minWidth: '120px' }}>
            {(Object.keys(STATUS_STYLES) as TicketStatus[]).map(opt => {
              const os = STATUS_STYLES[opt]
              return (
                <button key={opt} onClick={() => select(opt)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: opt === current ? C.muted : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={e => { if (opt !== current) e.currentTarget.style.background = C.muted }}
                  onMouseLeave={e => { if (opt !== current) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: os.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: C.fg }}>{os.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function TicketRow({ ticket, onUpdate }: { ticket: Ticket; onUpdate: (id: string, status: TicketStatus) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = `hsl(0 0% 98%)`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Avatar */}
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: C.primary, flexShrink: 0 }}>
          {(ticket.email ?? '?').charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: C.fg, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</p>
          <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>{ticket.email}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: '10px', color: C.mutedFg }}>
            {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          <StatusSelector ticketId={ticket.id} current={ticket.status} ticketEmail={ticket.email} ticketSubject={ticket.subject} onUpdate={onUpdate} />
        </div>
      </div>

      {/* Expanded message */}
      {expanded && (
        <div style={{ padding: '0 16px 16px 56px' }}>
          <div style={{ background: C.muted, borderRadius: '8px', padding: '12px 14px' }}>
            <p style={{ fontSize: '12px', color: C.fg, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.message}</p>
          </div>
          <p style={{ fontSize: '10px', color: C.mutedFg, margin: '8px 0 0', fontFamily: 'monospace' }}>ID: {ticket.id}</p>
          <a
  href="https://mail.google.com/"
  target="_blank"
  rel="noopener noreferrer"
  style={{ 
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    fontSize: '11px',
    fontWeight: 600,
    color: C.primary,
    textDecoration: 'none'
  }}
>
  Reply via email →
</a>
        </div>
      )}
    </div>
  )
}

export default function AdminSupportTab() {
  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [filter, setFilter]       = useState<TicketStatus | 'all'>('all')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setTickets((data as Ticket[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  function handleStatusUpdate(id: string, status: TicketStatus) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: C.primaryLight, display: 'flex' }}>
            <MessageCircle size={16} color={C.primary} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: C.fg }}>Support Tickets</h2>
            <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>{counts.open} open</p>
          </div>
        </div>
        <button onClick={fetchTickets} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: C.mutedFg, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.background = C.muted}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {([
          { key: 'all',         label: `All (${counts.all})` },
          { key: 'open',        label: `Open (${counts.open})` },
          { key: 'in_progress', label: `In Progress (${counts.in_progress})` },
          { key: 'resolved',    label: `Resolved (${counts.resolved})` },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em', border: `1px solid ${filter === f.key ? C.primary : C.border}`, background: filter === f.key ? C.primary : 'transparent', color: filter === f.key ? 'white' : C.mutedFg, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          >{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.primary, animation: 'spin 0.75s linear infinite' }} />
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        </div>
      ) : error ? (
        <p style={{ textAlign: 'center', color: C.red, fontSize: '13px', padding: '32px 0' }}>{error}</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.mutedFg }}>
          <MessageCircle size={32} color={C.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px' }}>No tickets found.</p>
        </div>
      ) : (
        <div style={{ borderRadius: C.radius, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {filtered.map(t => (
            <TicketRow key={t.id} ticket={t} onUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}