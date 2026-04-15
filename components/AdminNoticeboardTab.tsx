'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X, Pin, AlertCircle } from 'lucide-react'

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
  greenBorder:  '#bbf7d0',
  red:          '#dc2626',
  redLight:     '#fef2f2',
  radius:       '8px',
}

type Notice = {
  id: string
  text: string
  created_at: string
  active: boolean
}

function Badge({ children, variant = 'muted' }: { children: React.ReactNode; variant?: 'primary' | 'success' | 'muted' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.primaryLight, color: C.primary,  border: `1px solid ${C.primary}33` },
    success: { background: C.greenLight,   color: C.green,    border: `1px solid ${C.greenBorder}` },
    muted:   { background: C.muted,        color: C.mutedFg,  border: `1px solid ${C.border}` },
  }
  return (
    <span style={{ ...styles[variant], display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {children}
    </span>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderRadius: C.radius, background: C.primaryLight, border: `1px solid ${C.primary}22`, marginBottom: '16px' }}>
      <AlertCircle size={14} color={C.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
      <p style={{ fontSize: '12px', color: C.mutedFg, lineHeight: 1.6 }}>{children}</p>
    </div>
  )
}

function Btn({ onClick, disabled, variant = 'primary', children, style }: { onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost'; children: React.ReactNode; style?: React.CSSProperties }) {
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: C.radius, fontSize: '12px', fontWeight: 600, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s', fontFamily: 'inherit' }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.primary, color: '#fff' },
    ghost:   { background: 'transparent', color: C.mutedFg, border: `1px solid ${C.border}` },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: C.mutedFg, display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}
      onMouseEnter={e => (e.currentTarget.style.background = C.muted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  )
}

function Textarea({ value, onChange, disabled, rows = 2, placeholder }: { value: string; onChange?: (v: string) => void; disabled?: boolean; rows?: number; placeholder?: string }) {
  return (
    <textarea value={value} rows={rows} placeholder={placeholder} disabled={disabled} onChange={e => onChange?.(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', borderRadius: C.radius, fontSize: '12px', border: `1px solid ${C.border}`, background: disabled ? C.muted : C.bg, color: C.fg, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
      onFocus={e => !disabled && (e.currentTarget.style.borderColor = C.primary)}
      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
    />
  )
}

function Card({ children, highlighted = false }: { children: React.ReactNode; highlighted?: boolean }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${highlighted ? C.primary + '66' : C.border}`, borderRadius: '12px', overflow: 'hidden', boxShadow: highlighted ? `0 0 0 3px ${C.primary}11` : 'none' }}>
      {children}
    </div>
  )
}

function NoticeRow({ notice, onSave, onDelete, isNew = false, onCancelNew }: {
  notice: Notice | Omit<Notice, 'id' | 'created_at'>
  onSave: (text: string, active: boolean, id?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isNew?: boolean
  onCancelNew?: () => void
}) {
  const id = 'id' in notice ? notice.id : undefined
  const [editing, setEditing] = useState(isNew)
  const [text, setText]       = useState(notice.text)
  const [active, setActive]   = useState(notice.active)
  const [pending, start]      = useTransition()

  function handleSave() {
    start(async () => { await onSave(text, active, id); if (!isNew) setEditing(false) })
  }

  function handleCancel() {
    if (isNew) { onCancelNew?.(); return }
    setText(notice.text); setActive(notice.active); setEditing(false)
  }

  return (
    <Card highlighted={editing}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing
            ? <Textarea value={text} onChange={setText} rows={2} placeholder="Notice text…" />
            : <p style={{ fontSize: '13px', lineHeight: 1.5, color: text ? C.fg : C.mutedFg, fontStyle: text ? 'normal' : 'italic' }}>{text || 'Empty notice'}</p>
          }
          {'created_at' in notice && (
            <p style={{ fontSize: '10px', color: C.mutedFg, marginTop: '4px' }}>
              {new Date(notice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {editing && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ accentColor: C.primary, width: '14px', height: '14px' }} />
              <span style={{ fontSize: '12px', color: C.mutedFg }}>Show on homepage</span>
            </label>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {!editing && <Badge variant={active ? 'success' : 'muted'}>{active ? 'Live' : 'Hidden'}</Badge>}
          {!editing && <>
            <IconBtn title="Edit" onClick={() => setEditing(true)}><Pencil size={14} /></IconBtn>
            {id && onDelete && <IconBtn title="Delete" onClick={() => onDelete(id)}><Trash2 size={14} color={C.red} /></IconBtn>}
          </>}
          {editing && <>
            <Btn onClick={handleSave} disabled={pending}><Check size={12} />{pending ? 'Saving…' : 'Save'}</Btn>
            <IconBtn onClick={handleCancel}><X size={14} /></IconBtn>
          </>}
        </div>
      </div>
    </Card>
  )
}

export default function AdminNoticeboardTab() {
  const [notices, setNotices]   = useState<Notice[]>([])
  const [nLoading, setNLoading] = useState(true)
  const [nError, setNError]     = useState<string | null>(null)
  const [addingN, setAddingN]   = useState(false)

  const S = {
    skeleton:   { height: '64px', borderRadius: '12px', background: C.muted, marginBottom: '8px' } as React.CSSProperties,
    empty:      { textAlign: 'center' as const, padding: '64px 0', color: C.mutedFg },
    sectionHead:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } as React.CSSProperties,
  }

  async function loadNotices() {
    setNLoading(true)
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    if (error) setNError(error.message); else setNotices(data as Notice[])
    setNLoading(false)
  }

  async function saveNotice(text: string, active: boolean, id?: string) {
    const { error } = id
      ? await supabase.from('notices').update({ text, active }).eq('id', id)
      : await supabase.from('notices').insert({ text, active })
    if (error) { alert(error.message); return }
    if (!id) setAddingN(false)
    await loadNotices()
  }

  async function deleteNotice(id: string) {
    if (!confirm('Delete this notice?')) return
    await supabase.from('notices').delete().eq('id', id)
    await loadNotices()
  }

  useEffect(() => { loadNotices() }, [])

  return (
    <div>
      <div style={S.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: C.primaryLight, display: 'flex' }}>
            <Pin size={16} color={C.primary} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Cadet Noticeboard</h2>
            <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>{notices.length} total</p>
          </div>
        </div>
        <Btn onClick={() => setAddingN(true)} style={{ borderRadius: '10px', padding: '8px 16px' }}>
          <Plus size={14} />Add Notice
        </Btn>
      </div>

      <InfoBanner>
        The <strong style={{ color: C.fg }}>3 most recent active notices</strong> are shown on the homepage. Toggle Live/Hidden to control visibility without deleting.
      </InfoBanner>

      {nLoading && [1,2].map(i => <div key={i} style={S.skeleton} />)}
      {nError   && <p style={{ fontSize: '12px', color: C.red, textAlign: 'center', padding: '16px' }}>{nError}</p>}

      {!nLoading && !nError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {addingN && <NoticeRow notice={{ text: '', active: true }} onSave={saveNotice} isNew onCancelNew={() => setAddingN(false)} />}
          {notices.map(n => <NoticeRow key={n.id} notice={n} onSave={saveNotice} onDelete={deleteNotice} />)}
          {notices.length === 0 && !addingN && (
            <div style={S.empty}>
              <Pin size={36} color={C.border} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px' }}>No notices yet — add one above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}