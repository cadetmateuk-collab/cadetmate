'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp,
  BookOpen, AlertCircle, Image as ImageIcon, Lightbulb,
  GripVertical, List, Bold, Italic, LayoutList
} from 'lucide-react'

const supabase = createClient()

// ─── Design tokens (matching AdminNoticeboardTab) ─────────────
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
  amber:        '#d97706',
  amberLight:   '#fffbeb',
  radius:       '8px',
}

// ─── Types ───────────────────────────────────────────────────
type TaskCategory =
  | 'Safety'
  | 'Maintenance'
  | 'Bridge Watchkeeping & Navigation'
  | 'Ship Operations'
  | 'Mooring & Anchoring'
  | 'Operational Management'

const CATEGORIES: TaskCategory[] = [
  'Safety', 'Maintenance', 'Bridge Watchkeeping & Navigation',
  'Ship Operations', 'Mooring & Anchoring', 'Operational Management',
]

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  'Safety':                           '#dc2626',
  'Maintenance':                      '#ea580c',
  'Bridge Watchkeeping & Navigation': '#0891b2',
  'Ship Operations':                  '#16a34a',
  'Mooring & Anchoring':              '#7c3aed',
  'Operational Management':           '#ca8a04',
}

interface TaskStep {
  step: number | string
  title: string
  description: string  // may contain markdown bullet points: "- item\n- item"
  imagePlaceholder?: string
  imageUrl?: string
}

interface TRBTask {
  id: string
  code: string
  title: string
  category: TaskCategory
  description: string
  guidance: string
  steps: TaskStep[]
  image_urls?: { stepIndex: number; url: string; caption: string }[]
  updated_at?: string
}

// ─── Primitive UI components ──────────────────────────────────
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '6px', fontSize: '10px', fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap', flexShrink: 0,
      background: color + '18', color, border: `1px solid ${color}33`,
    }}>
      {children}
    </span>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: '10px', padding: '12px 16px',
      borderRadius: C.radius, background: C.primaryLight,
      border: `1px solid ${C.primary}22`, marginBottom: '16px',
    }}>
      <AlertCircle size={14} color={C.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
      <p style={{ fontSize: '12px', color: C.mutedFg, lineHeight: 1.6 }}>{children}</p>
    </div>
  )
}

function Btn({
  onClick, disabled, variant = 'primary', children, style, type = 'button'
}: {
  onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger';
  children: React.ReactNode; style?: React.CSSProperties; type?: 'button' | 'submit'
}) {
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.primary, color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: C.mutedFg, border: `1px solid ${C.border}` },
    danger:  { background: C.redLight, color: C.red, border: `1px solid ${C.red}33` },
  }
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: C.radius, fontSize: '12px',
        fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
        fontFamily: 'inherit', ...variants[variant], ...style,
      }}
    >{children}</button>
  )
}

function IconBtn({ onClick, title, children, color }: {
  onClick: () => void; title?: string; children: React.ReactNode; color?: string
}) {
  return (
    <button
      title={title} onClick={onClick}
      style={{
        padding: '6px', borderRadius: '6px', border: 'none',
        background: 'transparent', cursor: 'pointer',
        color: color || C.mutedFg, display: 'flex', alignItems: 'center',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = C.muted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  )
}

function Input({
  value, onChange, disabled, placeholder, style
}: {
  value: string; onChange?: (v: string) => void; disabled?: boolean;
  placeholder?: string; style?: React.CSSProperties
}) {
  return (
    <input
      value={value} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: '100%', padding: '7px 10px', borderRadius: C.radius,
        fontSize: '12px', border: `1px solid ${C.border}`,
        background: disabled ? C.muted : C.bg, color: C.fg,
        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, ...style,
      }}
      onFocus={e => !disabled && (e.currentTarget.style.borderColor = C.primary)}
      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
    />
  )
}

function Textarea({
  value, onChange, disabled, rows = 2, placeholder, style
}: {
  value: string; onChange?: (v: string) => void; disabled?: boolean;
  rows?: number; placeholder?: string; style?: React.CSSProperties
}) {
  return (
    <textarea
      value={value} rows={rows} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: C.radius,
        fontSize: '12px', border: `1px solid ${C.border}`,
        background: disabled ? C.muted : C.bg, color: C.fg,
        fontFamily: 'inherit', outline: 'none', resize: 'vertical',
        boxSizing: 'border-box' as const, lineHeight: 1.6, ...style,
      }}
      onFocus={e => !disabled && (e.currentTarget.style.borderColor = C.primary)}
      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
    />
  )
}

function Select({
  value, onChange, options, disabled
}: {
  value: string; onChange: (v: string) => void;
  options: string[]; disabled?: boolean
}) {
  return (
    <select
      value={value} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '7px 10px', borderRadius: C.radius,
        fontSize: '12px', border: `1px solid ${C.border}`,
        background: disabled ? C.muted : C.bg, color: C.fg,
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        boxSizing: 'border-box' as const,
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── Rich text toolbar for description fields ─────────────────
// Supports: bullet list (- prefix), bold (**text**), italic (*text*)
function RichTextbar({ onAction }: { onAction: (action: string) => void }) {
  const tools = [
    { label: '• List', icon: <List size={12} />, action: 'bullet' },
    { label: 'B', icon: <Bold size={12} />, action: 'bold' },
    { label: 'I', icon: <Italic size={12} />, action: 'italic' },
  ]
  return (
    <div style={{
      display: 'flex', gap: '4px', padding: '4px 6px',
      background: C.muted, borderRadius: `${C.radius} ${C.radius} 0 0`,
      border: `1px solid ${C.border}`, borderBottom: 'none',
    }}>
      <span style={{ fontSize: '10px', color: C.mutedFg, alignSelf: 'center', marginRight: '4px' }}>
        Format:
      </span>
      {tools.map(t => (
        <button
          key={t.action} type="button"
          title={t.label}
          onMouseDown={e => { e.preventDefault(); onAction(t.action) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '3px 7px', borderRadius: '4px', border: `1px solid ${C.border}`,
            background: C.bg, cursor: 'pointer', fontSize: '11px',
            fontWeight: 600, color: C.fg, fontFamily: 'inherit',
          }}
        >{t.icon} {t.label}</button>
      ))}
      <span style={{ fontSize: '10px', color: C.mutedFg, alignSelf: 'center', marginLeft: 'auto' }}>
        Use "- item" for bullets
      </span>
    </div>
  )
}

function RichTextarea({
  value, onChange, rows = 3, placeholder
}: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleAction(action: string) {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)

    let insert = selected
    if (action === 'bullet') {
      insert = selected
        ? selected.split('\n').map(l => `- ${l}`).join('\n')
        : '- '
    } else if (action === 'bold') {
      insert = `**${selected || 'bold text'}**`
    } else if (action === 'italic') {
      insert = `*${selected || 'italic text'}*`
    }

    const next = value.slice(0, start) + insert + value.slice(end)
    onChange(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + insert.length, start + insert.length)
    }, 0)
  }

  return (
    <div>
      <RichTextbar onAction={handleAction} />
      <textarea
        ref={ref}
        value={value} rows={rows} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px', fontSize: '12px',
          border: `1px solid ${C.border}`, borderTop: 'none',
          borderRadius: `0 0 ${C.radius} ${C.radius}`,
          background: C.bg, color: C.fg, fontFamily: 'monospace',
          outline: 'none', resize: 'vertical', lineHeight: 1.6,
          boxSizing: 'border-box' as const,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
      />
    </div>
  )
}

// ─── Rendered preview of markdown-lite text ───────────────────
function RenderText({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let bulletBuffer: string[] = []

  function flushBullets() {
    if (bulletBuffer.length === 0) return
    elements.push(
      <ul key={elements.length} style={{ margin: '4px 0 4px 16px', padding: 0 }}>
        {bulletBuffer.map((b, i) => (
          <li key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: C.fg }}
            dangerouslySetInnerHTML={{ __html: renderInline(b) }} />
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  function renderInline(s: string) {
    return s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
  }

  lines.forEach((line, i) => {
    if (line.startsWith('- ')) {
      bulletBuffer.push(line.slice(2))
    } else {
      flushBullets()
      if (line.trim()) {
        elements.push(
          <p key={i} style={{ fontSize: '13px', lineHeight: 1.5, margin: '2px 0', color: C.fg }}
            dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
        )
      }
    }
  })
  flushBullets()

  return <div>{elements}</div>
}

// ─── Step editor row ──────────────────────────────────────────
function StepRow({
  step, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, onImageUpload
}: {
  step: TaskStep
  index: number
  onChange: (s: TaskStep) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  onImageUpload: (file: File, stepIndex: number) => Promise<string>
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await onImageUpload(file, index)
      onChange({ ...step, imageUrl: url, imagePlaceholder: undefined })
    } catch (err) {
      alert('Image upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: '10px',
      overflow: 'hidden', background: C.bg, marginBottom: '8px',
    }}>
      {/* Step header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', background: C.muted, borderBottom: `1px solid ${C.border}`,
      }}>
        <GripVertical size={14} color={C.mutedFg} style={{ flexShrink: 0 }} />
        <span style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: C.primary + '18', color: C.primary,
          fontSize: '10px', fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{step.step}</span>
        <Input
          value={step.title}
          onChange={v => onChange({ ...step, title: v })}
          placeholder="Step title…"
          style={{ flex: 1 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <IconBtn onClick={onMoveUp} title="Move up" ><ChevronUp size={14} /></IconBtn>
          <IconBtn onClick={onMoveDown} title="Move down"><ChevronDown size={14} /></IconBtn>
          <IconBtn onClick={onDelete} title="Delete step" color={C.red}><Trash2 size={14} /></IconBtn>
        </div>
      </div>

      {/* Step body */}
      <div style={{ padding: '12px' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, color: C.mutedFg, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
          Description
        </label>
        <RichTextarea
          value={step.description}
          onChange={v => onChange({ ...step, description: v })}
          rows={3}
          placeholder="Step description — use '- item' for bullet points, **bold**, *italic*"
        />

        {/* Image section */}
        <div style={{ marginTop: '10px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: C.mutedFg, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
            Image (optional)
          </label>

          {step.imageUrl ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={step.imageUrl}
                alt={step.title}
                style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: C.radius, border: `1px solid ${C.border}`, display: 'block' }}
              />
              <button
                onClick={() => onChange({ ...step, imageUrl: undefined })}
                style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: C.red, border: 'none', borderRadius: '50%',
                  width: '22px', height: '22px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
              ><X size={12} /></button>
            </div>
          ) : step.imagePlaceholder ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '8px', padding: '8px 12px', borderRadius: C.radius,
              border: `1px dashed ${C.border}`, background: C.muted,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={13} color={C.mutedFg} />
                <Input
                  value={step.imagePlaceholder}
                  onChange={v => onChange({ ...step, imagePlaceholder: v })}
                  placeholder="Image placeholder label…"
                  style={{ fontSize: '11px' }}
                />
              </div>
              <Btn variant="ghost" onClick={() => fileRef.current?.click()} style={{ flexShrink: 0 }}>
                Upload
              </Btn>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: C.radius,
              border: `1px dashed ${C.border}`, background: C.muted,
            }}>
              <Btn variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <ImageIcon size={12} />
                {uploading ? 'Uploading…' : 'Upload image'}
              </Btn>
              <Btn variant="ghost" onClick={() => onChange({ ...step, imagePlaceholder: 'Image placeholder' })}>
                <LayoutList size={12} />
                Add placeholder label
              </Btn>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      </div>
    </div>
  )
}

// ─── Task card (collapsed + expanded editor) ──────────────────
function TaskRow({
  task, onSave, onDelete, isNew = false, onCancelNew,
}: {
  task: TRBTask
  onSave: (t: TRBTask) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isNew?: boolean
  onCancelNew?: () => void
}) {
  const [expanded, setExpanded] = useState(isNew)
  const [editing, setEditing]   = useState(isNew)
  const [draft, setDraft]       = useState<TRBTask>({ ...task, steps: task.steps.map(s => ({ ...s })) })
  const [pending, start]        = useTransition()

  function resetDraft() {
    setDraft({ ...task, steps: task.steps.map(s => ({ ...s })) })
  }

  function handleCancel() {
    if (isNew) { onCancelNew?.(); return }
    resetDraft(); setEditing(false); setExpanded(false)
  }

  function handleSave() {
    start(async () => {
      await onSave(draft)
      if (!isNew) setEditing(false)
    })
  }

  function addStep() {
    const nextNum = draft.steps.length + 1
    setDraft(d => ({
      ...d,
      steps: [...d.steps, { step: nextNum, title: '', description: '' }],
    }))
  }

  function updateStep(index: number, step: TaskStep) {
    setDraft(d => {
      const steps = [...d.steps]
      steps[index] = step
      return { ...d, steps }
    })
  }

  function deleteStep(index: number) {
    setDraft(d => ({ ...d, steps: d.steps.filter((_, i) => i !== index) }))
  }

  function moveStep(index: number, dir: -1 | 1) {
    setDraft(d => {
      const steps = [...d.steps]
      const target = index + dir
      if (target < 0 || target >= steps.length) return d;
      [steps[index], steps[target]] = [steps[target], steps[index]]
      return { ...d, steps }
    })
  }

  async function uploadImage(file: File, stepIndex: number): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${draft.id}/step-${stepIndex}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('trb-images').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('trb-images').getPublicUrl(path)
    return data.publicUrl
  }

  const catColor = CATEGORY_COLORS[draft.category] || C.primary

  return (
    <div style={{
      background: C.bg, border: `1px solid ${editing ? C.primary + '66' : C.border}`,
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: editing ? `0 0 0 3px ${C.primary}11` : 'none',
      marginBottom: '8px',
    }}>
      {/* ── Collapsed header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', cursor: editing ? 'default' : 'pointer',
        }}
        onClick={() => !editing && setExpanded(e => !e)}
      >
        <span style={{
          fontSize: '10px', fontWeight: 700, color: C.primary,
          background: C.primaryLight, padding: '3px 8px', borderRadius: '6px',
          flexShrink: 0, letterSpacing: '0.05em',
        }}>{draft.code || '???'}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {draft.title || <span style={{ color: C.mutedFg, fontStyle: 'italic' }}>Untitled task</span>}
          </p>
          {!editing && (
            <p style={{ fontSize: '11px', color: C.mutedFg, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {draft.description || 'No description'}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Badge color={catColor}>{draft.category}</Badge>
          {!editing && (
            <>
              <IconBtn title="Edit" onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(true) }}>
                <Pencil size={14} />
              </IconBtn>
              {task.id && onDelete && (
                <IconBtn title="Delete task" onClick={e => { e.stopPropagation(); onDelete(task.id) }} color={C.red}>
                  <Trash2 size={14} />
                </IconBtn>
              )}
              <ChevronDown size={14} color={C.mutedFg} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </>
          )}
          {editing && (
            <>
              <Btn onClick={handleSave} disabled={pending}>
                <Check size={12} />{pending ? 'Saving…' : 'Save task'}
              </Btn>
              <IconBtn onClick={handleCancel}><X size={14} /></IconBtn>
            </>
          )}
        </div>
      </div>

      {/* ── Read-only expanded view ── */}
      {expanded && !editing && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px' }}>
          {draft.guidance && (
            <div style={{
              display: 'flex', gap: '10px', padding: '10px 14px',
              borderRadius: C.radius, background: C.amberLight,
              border: `1px solid ${C.amber}33`, marginBottom: '12px',
            }}>
              <Lightbulb size={14} color={C.amber} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
                  Guidance & Tips
                </p>
                <p style={{ fontSize: '12px', color: C.fg, lineHeight: 1.6, margin: 0 }}>{draft.guidance}</p>
              </div>
            </div>
          )}

          <p style={{ fontSize: '10px', fontWeight: 700, color: C.mutedFg, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            {draft.steps.length} Steps
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {draft.steps.map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px' }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: C.primary + '18', color: C.primary,
                  fontSize: '10px', fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{step.step}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 3px' }}>{step.title}</p>
                  <RenderText text={step.description} />
                  {step.imageUrl && (
                    <img src={step.imageUrl} alt={step.title}
                      style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '180px', borderRadius: C.radius, border: `1px solid ${C.border}` }}
                    />
                  )}
                  {!step.imageUrl && step.imagePlaceholder && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: C.radius, border: `1px dashed ${C.border}`, background: C.muted }}>
                      <ImageIcon size={12} color={C.mutedFg} />
                      <span style={{ fontSize: '11px', color: C.mutedFg }}>{step.imagePlaceholder}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Edit form ── */}
      {editing && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {/* Code */}
            <div>
              <label style={labelStyle}>Task Code</label>
              <Input value={draft.code} onChange={v => setDraft(d => ({ ...d, code: v }))} placeholder="e.g. A11" />
            </div>
            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <Select
                value={draft.category}
                onChange={v => setDraft(d => ({ ...d, category: v as TaskCategory }))}
                options={CATEGORIES}
              />
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Task Title</label>
            <Input value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} placeholder="Full task title…" />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Short Description</label>
            <Textarea value={draft.description} onChange={v => setDraft(d => ({ ...d, description: v }))} rows={2} placeholder="One-line description shown in the task list…" />
          </div>

          {/* Guidance */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lightbulb size={11} color={C.amber} /> Guidance & Tips
            </label>
            <RichTextarea
              value={draft.guidance}
              onChange={v => setDraft(d => ({ ...d, guidance: v }))}
              rows={4}
              placeholder="Tips and guidance shown to cadets. Supports **bold**, *italic*, and '- bullet' lists."
            />
          </div>

          {/* Steps */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Steps ({draft.steps.length})</label>
              <Btn variant="ghost" onClick={addStep} style={{ fontSize: '11px', padding: '4px 10px' }}>
                <Plus size={12} /> Add step
              </Btn>
            </div>

            {draft.steps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: C.mutedFg, fontSize: '12px', border: `1px dashed ${C.border}`, borderRadius: C.radius }}>
                No steps yet — click "Add step" to begin.
              </div>
            )}

            {draft.steps.map((step, i) => (
              <StepRow
                key={i}
                step={step}
                index={i}
                onChange={s => updateStep(i, s)}
                onDelete={() => deleteStep(i)}
                onMoveUp={() => moveStep(i, -1)}
                onMoveDown={() => moveStep(i, 1)}
                isFirst={i === 0}
                isLast={i === draft.steps.length - 1}
                onImageUpload={uploadImage}
              />
            ))}
          </div>

          {/* Footer save/cancel */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
            <Btn variant="ghost" onClick={handleCancel}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={pending}>
              <Check size={12} />{pending ? 'Saving…' : 'Save task'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: C.mutedFg,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: '4px',
}

// ─── Main tab component ───────────────────────────────────────
export default function AdminTRBTasksTab() {
  const [tasks, setTasks]     = useState<TRBTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [adding, setAdding]   = useState(false)
  const [search, setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState<TaskCategory | 'All'>('All')

  const S = {
    skeleton:    { height: '64px', borderRadius: '12px', background: C.muted, marginBottom: '8px' } as React.CSSProperties,
    empty:       { textAlign: 'center' as const, padding: '64px 0', color: C.mutedFg },
    sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } as React.CSSProperties,
  }

  async function loadTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trb_tasks').select('*').order('code')
    if (error) setError(error.message)
    else setTasks(data as TRBTask[])
    setLoading(false)
  }

  async function saveTask(task: TRBTask) {
    const payload = {
      id:          task.id,
      code:        task.code,
      title:       task.title,
      category:    task.category,
      description: task.description,
      guidance:    task.guidance,
      steps:       task.steps,
      image_urls:  task.image_urls || [],
    }

    const { error } = task.id && tasks.find(t => t.id === task.id)
      ? await supabase.from('trb_tasks').update(payload).eq('id', task.id)
      : await supabase.from('trb_tasks').insert(payload)

    if (error) { alert(error.message); return }
    setAdding(false)
    await loadTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm(`Delete task ${id}? This cannot be undone.`)) return
    await supabase.from('trb_tasks').delete().eq('id', id)
    await loadTasks()
  }

  useEffect(() => { loadTasks() }, [])

  const filtered = tasks.filter(t => {
    const matchCat = catFilter === 'All' || t.category === catFilter
    const q = search.toLowerCase()
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const newTaskTemplate: TRBTask = {
    id: '', code: '', title: '', category: 'Safety',
    description: '', guidance: '', steps: [], image_urls: [],
  }

  return (
    <div>
      {/* Header */}
      <div style={S.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: C.primaryLight, display: 'flex' }}>
            <BookOpen size={16} color={C.primary} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>TRB Tasks</h2>
            <p style={{ fontSize: '11px', color: C.mutedFg, margin: 0 }}>{tasks.length} tasks in database</p>
          </div>
        </div>
        <Btn onClick={() => setAdding(true)} style={{ borderRadius: '10px', padding: '8px 16px' }}>
          <Plus size={14} /> Add Task
        </Btn>
      </div>

      <InfoBanner>
        Changes save directly to Supabase and are <strong style={{ color: C.fg }}>immediately live</strong> for cadets.
        Use <strong style={{ color: C.fg }}>- bullet</strong> syntax in descriptions for bullet points, and <strong style={{ color: C.fg }}>**bold**</strong> / <strong style={{ color: C.fg }}>*italic*</strong> for emphasis.
      </InfoBanner>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search tasks…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '7px 12px', borderRadius: C.radius,
            fontSize: '12px', border: `1px solid ${C.border}`, background: C.bg,
            color: C.fg, fontFamily: 'inherit', outline: 'none',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
          onBlur={e => (e.currentTarget.style.borderColor = C.border)}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value as TaskCategory | 'All')}
          style={{
            padding: '7px 10px', borderRadius: C.radius, fontSize: '12px',
            border: `1px solid ${C.border}`, background: C.bg, color: C.fg,
            fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Showing count */}
      {!loading && (
        <p style={{ fontSize: '11px', color: C.mutedFg, marginBottom: '12px' }}>
          Showing {filtered.length} of {tasks.length} tasks
        </p>
      )}

      {/* Loading skeletons */}
      {loading && [1, 2, 3, 4].map(i => <div key={i} style={S.skeleton} />)}

      {/* Error */}
      {error && <p style={{ fontSize: '12px', color: C.red, textAlign: 'center', padding: '16px' }}>{error}</p>}

      {/* Task list */}
      {!loading && !error && (
        <div>
          {adding && (
            <TaskRow
              task={newTaskTemplate}
              onSave={saveTask}
              isNew
              onCancelNew={() => setAdding(false)}
            />
          )}

          {filtered.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onSave={saveTask}
              onDelete={deleteTask}
            />
          ))}

          {filtered.length === 0 && !adding && (
            <div style={S.empty}>
              <BookOpen size={36} color={C.border} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: '13px' }}>
                {search || catFilter !== 'All' ? 'No tasks match your search.' : 'No tasks yet — add one above.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}