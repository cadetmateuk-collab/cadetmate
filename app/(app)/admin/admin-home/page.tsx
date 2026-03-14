'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Pencil, Check, X, HelpCircle, Pin,
  ChevronDown, ChevronUp, Calendar, ShipWheel, AlertCircle,
} from 'lucide-react'

// ─── Brand tokens (from globals.css) ──────────────────────────────────────────
const C = {
  bg:           '#ffffff',
  fg:           '#000000',
  primary:      '#2966f4',
  primaryLight: '#eef2fe',  // accent
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

// ─── Types ─────────────────────────────────────────────────────────────────────

type Question = {
  id: string
  question_date: string | null
  question: string
  options: string[]
  correct_answer: string
  explanation: string | null
}

type Notice = {
  id: string
  text: string
  created_at: string
  active: boolean
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Badge({ children, variant = 'muted' }: { children: React.ReactNode; variant?: 'primary' | 'success' | 'muted' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.primaryLight, color: C.primary,  border: `1px solid ${C.primary}33` },
    success: { background: C.greenLight,   color: C.green,    border: `1px solid ${C.greenBorder}` },
    muted:   { background: C.muted,        color: C.mutedFg,  border: `1px solid ${C.border}` },
  }
  return (
    <span style={{
      ...styles[variant],
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '6px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.mutedFg, marginBottom: '6px' }}>
      {children}
    </p>
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

function Btn({ onClick, disabled, variant = 'primary', children, style }: {
  onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; children: React.ReactNode; style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: C.radius, fontSize: '12px', fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s', fontFamily: 'inherit',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.primary,   color: '#fff' },
    ghost:   { background: 'transparent', color: C.mutedFg, border: `1px solid ${C.border}` },
    danger:  { background: C.redLight,  color: C.red,   border: `1px solid ${C.red}33` },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} style={{
      padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent',
      cursor: 'pointer', color: C.mutedFg, display: 'flex', alignItems: 'center', fontFamily: 'inherit',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = C.muted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

function Input({ value, onChange, disabled, type = 'text', placeholder, style }: {
  value: string; onChange?: (v: string) => void; disabled?: boolean; type?: string; placeholder?: string; style?: React.CSSProperties
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: C.radius, fontSize: '12px',
        border: `1px solid ${C.border}`, background: disabled ? C.muted : C.bg,
        color: C.fg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', ...style,
      }}
      onFocus={e => !disabled && (e.currentTarget.style.borderColor = C.primary)}
      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
    />
  )
}

function Textarea({ value, onChange, disabled, rows = 2, placeholder }: {
  value: string; onChange?: (v: string) => void; disabled?: boolean; rows?: number; placeholder?: string
}) {
  return (
    <textarea
      value={value} rows={rows} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: C.radius, fontSize: '12px',
        border: `1px solid ${C.border}`, background: disabled ? C.muted : C.bg,
        color: C.fg, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box',
      }}
      onFocus={e => !disabled && (e.currentTarget.style.borderColor = C.primary)}
      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
    />
  )
}

function Select({ value, onChange, disabled, options }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; options: { label: string; value: string }[]
}) {
  return (
    <select
      value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: C.radius, fontSize: '12px',
        border: `1px solid ${C.border}`, background: disabled ? C.muted : C.bg,
        color: C.fg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Card({ children, highlighted = false }: { children: React.ReactNode; highlighted?: boolean }) {
  return (
    <div style={{
      background: C.bg, border: `1px solid ${highlighted ? C.primary + '66' : C.border}`,
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: highlighted ? `0 0 0 3px ${C.primary}11` : 'none',
    }}>
      {children}
    </div>
  )
}

// ─── Empty question ────────────────────────────────────────────────────────────

const emptyQ = (): Omit<Question, 'id'> => ({
  question_date: null, question: '', options: ['', '', '', ''], correct_answer: '', explanation: '',
})

// ─── Question Row ──────────────────────────────────────────────────────────────

function QuestionRow({ q, onSave, onDelete, isNew = false, onCancelNew }: {
  q: Question | Omit<Question, 'id'>
  onSave: (data: Omit<Question, 'id'>, id?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isNew?: boolean
  onCancelNew?: () => void
}) {
  const id = 'id' in q ? q.id : undefined
  const [editing, setEditing]   = useState(isNew)
  const [expanded, setExpanded] = useState(isNew)
  const [form, setForm] = useState<Omit<Question, 'id'>>({
    question_date: q.question_date, question: q.question,
    options: [...q.options], correct_answer: q.correct_answer, explanation: q.explanation,
  })
  const [pending, start] = useTransition()

  function setOpt(i: number, val: string) {
    const next = [...form.options]; next[i] = val; setForm(f => ({ ...f, options: next }))
  }

  function handleSave() {
    start(async () => { await onSave(form, id); if (!isNew) setEditing(false) })
  }

  function handleCancel() {
    if (isNew) { onCancelNew?.(); return }
    setForm({ question_date: q.question_date, question: q.question, options: [...q.options], correct_answer: q.correct_answer, explanation: q.explanation })
    setEditing(false)
  }

  const today      = new Date().toISOString().slice(0, 10)
  const isUpcoming = !!form.question_date && form.question_date >= today

  return (
    <Card highlighted={editing}>
      {/* Header */}
      <div
        onClick={() => !editing && setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: editing ? 'default' : 'pointer', userSelect: 'none' }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {form.question_date
            ? <Badge variant={isUpcoming ? 'success' : 'muted'}>{form.question_date}</Badge>
            : <Badge variant="muted">Unscheduled</Badge>
          }
          <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: form.question ? C.fg : C.mutedFg, fontStyle: form.question ? 'normal' : 'italic' }}>
            {form.question || 'New question…'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {!editing ? (
            <>
              <IconBtn title="Edit" onClick={() => { setEditing(true); setExpanded(true) }}><Pencil size={14} /></IconBtn>
              {id && onDelete && <IconBtn title="Delete" onClick={() => onDelete(id)}><Trash2 size={14} color={C.red} /></IconBtn>}
              <div style={{ color: C.mutedFg, paddingLeft: '4px', display: 'flex' }}>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </>
          ) : (
            <>
              <Btn onClick={handleSave} disabled={pending}><Check size={12} />{pending ? 'Saving…' : 'Save'}</Btn>
              <IconBtn onClick={handleCancel}><X size={14} /></IconBtn>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {(expanded || editing) && (
        <div style={{ padding: '16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.question_date ?? ''} onChange={v => setForm(f => ({ ...f, question_date: v || null }))} disabled={!editing} />
            </div>
            <div>
              <Label>Correct Answer</Label>
              <Select
                value={form.correct_answer}
                onChange={v => setForm(f => ({ ...f, correct_answer: v }))}
                disabled={!editing}
                options={[{ label: 'Select…', value: '' }, ...form.options.filter(Boolean).map(o => ({ label: o, value: o }))]}
              />
            </div>
          </div>

          <div>
            <Label>Question</Label>
            <Textarea value={form.question} onChange={v => setForm(f => ({ ...f, question: v }))} disabled={!editing} rows={2} />
          </div>

          <div>
            <Label>Options</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.mutedFg, width: '14px', flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>
                  <Input value={opt} onChange={v => setOpt(i, v)} disabled={!editing} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Explanation <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></Label>
            <Input value={form.explanation ?? ''} onChange={v => setForm(f => ({ ...f, explanation: v }))} disabled={!editing} placeholder="Brief explanation shown after answering…" />
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Notice Row ────────────────────────────────────────────────────────────────

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
          {!editing && (
            <>
              <IconBtn title="Edit" onClick={() => setEditing(true)}><Pencil size={14} /></IconBtn>
              {id && onDelete && <IconBtn title="Delete" onClick={() => onDelete(id)}><Trash2 size={14} color={C.red} /></IconBtn>}
            </>
          )}
          {editing && (
            <>
              <Btn onClick={handleSave} disabled={pending}><Check size={12} />{pending ? 'Saving…' : 'Save'}</Btn>
              <IconBtn onClick={handleCancel}><X size={14} /></IconBtn>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const supabase = createClient()

  const [questions, setQuestions] = useState<Question[]>([])
  const [qLoading, setQLoading]   = useState(true)
  const [qError, setQError]       = useState<string | null>(null)
  const [addingQ, setAddingQ]     = useState(false)

  const [notices, setNotices]   = useState<Notice[]>([])
  const [nLoading, setNLoading] = useState(true)
  const [nError, setNError]     = useState<string | null>(null)
  const [addingN, setAddingN]   = useState(false)

  async function loadQuestions() {
    setQLoading(true)
    const { data, error } = await supabase.from('daily_questions').select('*').order('question_date', { ascending: false, nullsFirst: true })
    if (error) setQError(error.message); else setQuestions(data as Question[])
    setQLoading(false)
  }

  async function loadNotices() {
    setNLoading(true)
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    if (error) setNError(error.message); else setNotices(data as Notice[])
    setNLoading(false)
  }

  useEffect(() => { loadQuestions(); loadNotices() }, [])

  async function saveQuestion(data: Omit<Question, 'id'>, id?: string) {
    const payload = { question_date: data.question_date || null, question: data.question, options: data.options.filter(Boolean), correct_answer: data.correct_answer, explanation: data.explanation || null }
    const { error } = id
      ? await supabase.from('daily_questions').update(payload).eq('id', id)
      : await supabase.from('daily_questions').insert(payload)
    if (error) { alert(error.message); return }
    if (!id) setAddingQ(false)
    await loadQuestions()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('daily_questions').delete().eq('id', id)
    await loadQuestions()
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

  const today    = new Date().toISOString().slice(0, 10)
  const upcoming = questions.filter(q => q.question_date && q.question_date >= today)
  const past     = questions.filter(q => !q.question_date || q.question_date < today)

  const S = {
    page:       { minHeight: '100vh', background: C.bg, color: C.fg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } as React.CSSProperties,
    header:     { position: 'sticky' as const, top: 0, zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.border}`, padding: '0 32px' },
    headerInner:{ display: 'flex', alignItems: 'center', gap: '16px', height: '56px' } as React.CSSProperties,
    content:    { maxWidth: '860px', margin: '0 auto', padding: '0 32px' } as React.CSSProperties,
    divider:    { borderTop: `1px solid ${C.border}`, margin: '8px 0 32px' } as React.CSSProperties,
    sectionHead:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } as React.CSSProperties,
    iconWrap:   { padding: '8px', borderRadius: '10px', background: C.primaryLight, display: 'flex' } as React.CSSProperties,
    navLink:    { padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: C.mutedFg, textDecoration: 'none', transition: 'background 0.15s' } as React.CSSProperties,
    subLabel:   { fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: C.mutedFg, padding: '12px 4px 4px', display: 'block' },
    skeleton:   { height: '48px', borderRadius: '12px', background: C.muted, marginBottom: '8px' } as React.CSSProperties,
    empty:      { textAlign: 'center' as const, padding: '64px 0', color: C.mutedFg },
  }

  return (
    <div style={S.page}>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={S.iconWrap}><ShipWheel size={16} color={C.primary} /></div>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>CadetMate</span>
            <span style={{ color: C.border, fontSize: '16px' }}>·</span>
            <span style={{ fontSize: '14px', color: C.mutedFg }}>Admin</span>
          </div>

          <div style={{ width: '1px', height: '16px', background: C.border, margin: '0 4px' }} />

          <nav style={{ display: 'flex', gap: '4px' }}>
            <a href="#questions"   style={S.navLink} onMouseEnter={e => (e.currentTarget.style.background = C.muted)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Questions</a>
            <a href="#noticeboard" style={S.navLink} onMouseEnter={e => (e.currentTarget.style.background = C.muted)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Noticeboard</a>
          </nav>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.mutedFg }}>
            <Calendar size={13} />
            <span>Today: <strong style={{ color: C.fg }}>{today}</strong></span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={S.content}>

        {/* ── Questions ── */}
        <section id="questions" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
          <div style={S.sectionHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={S.iconWrap}><HelpCircle size={16} color={C.primary} /></div>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Question of the Day</h2>
                <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>{questions.length} total</p>
              </div>
            </div>
            <Btn onClick={() => setAddingQ(true)} style={{ borderRadius: '10px', padding: '8px 16px' }}>
              <Plus size={14} />Add Question
            </Btn>
          </div>

          <InfoBanner>
            Questions with a date assigned show on that date. The nightly cron runs at <strong style={{ color: C.fg }}>00:00 UK time</strong> and auto-assigns an unscheduled question to any day with none set.
          </InfoBanner>

          {qLoading && [1,2,3].map(i => <div key={i} style={S.skeleton} />)}
          {qError   && <p style={{ fontSize: '12px', color: C.red, textAlign: 'center', padding: '16px' }}>{qError}</p>}

          {!qLoading && !qError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {addingQ && <QuestionRow q={emptyQ()} onSave={saveQuestion} isNew onCancelNew={() => setAddingQ(false)} />}

              {upcoming.length > 0 && <>
                <span style={S.subLabel}>Upcoming / Today</span>
                {upcoming.map(q => <QuestionRow key={q.id} q={q} onSave={saveQuestion} onDelete={deleteQuestion} />)}
              </>}

              {past.length > 0 && <>
                <span style={{ ...S.subLabel, paddingTop: '20px' }}>Unscheduled &amp; Past</span>
                {past.map(q => <QuestionRow key={q.id} q={q} onSave={saveQuestion} onDelete={deleteQuestion} />)}
              </>}

              {questions.length === 0 && !addingQ && (
                <div style={S.empty}>
                  <HelpCircle size={36} color={C.border} style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '13px' }}>No questions yet — add one above.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <div style={S.divider} />

        {/* ── Noticeboard ── */}
        <section id="noticeboard" style={{ paddingBottom: '48px' }}>
          <div style={S.sectionHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={S.iconWrap}><Pin size={16} color={C.primary} /></div>
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

          {nLoading && [1,2].map(i => <div key={i} style={{ ...S.skeleton, height: '64px' }} />)}
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
        </section>
      </div>
    </div>
  )
}