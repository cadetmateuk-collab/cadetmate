'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, X, Send, CheckCircle, ChevronDown, AlertCircle, MessageCircleQuestionMark } from 'lucide-react'

const HIDE_WIDGET_PREFIXES = [
  '/home',
  '/pricing',
  '/about',
  '/contact',
  '/resources',
  '/free-content',
  '/community-preview',
  '/partners',
]

const CATEGORIES = [
  'Bug / Something broken',
  'Account issue',
  'Billing / Payment',
  'Content question',
  'Feature request',
  'Other',
]

type Step = 'closed' | 'form' | 'success'

export default function SupportWidget() {
  const pathname = usePathname()
  const supabase = createClient()
  const [step, setStep]           = useState<Step>('closed')
  const [subject, setSubject]     = useState('')
  const [message, setMessage]     = useState('')
  const [category, setCategory]   = useState(CATEGORIES[0])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName]   = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setIsLoggedIn(true)
      setUserEmail(data.user.email ?? null)
      supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          setUserName(p?.full_name ?? null)
          if (p?.email) setUserEmail(p.email)
        })
    })
  }, [])

  useEffect(() => {
    if (step === 'closed') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStep('closed')
        setSubject('')
        setMessage('')
        setCategory(CATEGORIES[0])
        setError(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    const fullSubject = `[${category}] ${subject}`
    const { data: ticket, error: ticketErr } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        email:   userEmail ?? user.email ?? '',
        subject: fullSubject,
        message,
      })
      .select('id')
      .single()

    if (ticketErr) {
      console.error('Ticket insert error:', ticketErr)
      setError(`Failed to submit ticket: ${ticketErr.message}`)
      setLoading(false)
      return
    }

    const res = await fetch('/api/send-ticket-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: userEmail ?? user.email,
        userName:  userName ?? userEmail ?? 'Cadet',
        subject:   fullSubject,
        message,
        ticketId:  ticket.id,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Email API error:', body)
      setError(
        `Ticket saved but email failed: ${body.error ?? res.statusText}. ` +
        `We still have your ticket (ID: ${ticket.id}).`
      )
      setLoading(false)
      return
    }

    setLoading(false)
    setStep('success')
    void import('@/lib/analytics').then(({ trackFormSubmit, trackConversion }) => {
      trackFormSubmit('support_ticket', 'success', { category })
      trackConversion('generate_lead', { lead_type: 'support_ticket', category })
    })
  }

  function handleClose() {
    setStep('closed')
    setSubject('')
    setMessage('')
    setCategory(CATEGORIES[0])
    setError(null)
  }

  const hideOnPage = HIDE_WIDGET_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (hideOnPage) return null

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        .sw-panel { animation: slideUp 0.2s ease both; }
        .sw-btn   { animation: fadeIn 0.3s ease both 0.5s; }
      `}</style>

      {/* ── Floating button ── */}
      {step === 'closed' && (
        <button
          onClick={() => setStep('form')}
          className="sw-btn"
          aria-label="Open support"
          style={{
            position: 'fixed',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
            right: 'max(16px, env(safe-area-inset-right))',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '44px', minHeight: '44px',
            padding: '12px 18px', borderRadius: '999px',
            background: '#2966f4', color: 'white',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '13px', fontWeight: 700,
            boxShadow: '0 4px 24px rgba(41,102,244,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            touchAction: 'manipulation',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(41,102,244,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 24px rgba(41,102,244,0.35)' }}
        >
          <MessageCircleQuestionMark size={16} />
        </button>
      )}

      {/* ── Panel ── */}
      {step !== 'closed' && (
        <div
          className="sw-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Support"
          style={{
            position: 'fixed',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
            right: 'max(16px, env(safe-area-inset-right))',
            left: 'auto',
            zIndex: 50,
            width: 'min(340px, calc(100vw - 32px))',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '16px',
            background: '#ffffff', border: '1px solid #ededed',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            maxHeight: 'min(70dvh, 520px)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#2966f4', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={15} color="white" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Support</span>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close support"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, margin: '-8px', touchAction: 'manipulation' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Success ── */}
          {step === 'success' && (
            <div style={{ padding: '32px 20px', textAlign: 'center', overflowY: 'auto' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle size={24} color="#16a34a" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Ticket submitted!</p>
              <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 20px', lineHeight: 1.5 }}>
                We've sent a confirmation to <strong>{userEmail}</strong>. We'll be in touch soon.
              </p>
              <button onClick={handleClose} style={{ minHeight: 44, padding: '10px 20px', borderRadius: '8px', background: '#2966f4', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', touchAction: 'manipulation' }}>
                Done
              </button>
            </div>
          )}

          {/* ── Form ── */}
          {step === 'form' && (
            <div style={{ padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {!isLoggedIn ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>
                    You need to be logged in to submit a support ticket.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#737373', margin: 0, lineHeight: 1.5 }}>
                    Hi {userName?.split(' ')[0] ?? 'there'}! Tell us what's going on and we'll get back to you.
                  </p>

                  {/* Category */}
                  <div style={{ position: 'relative' }}>
                    <label htmlFor="sw-category" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                      Category
                    </label>
                    <select
                      id="sw-category"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ width: '100%', minHeight: 44, padding: '10px 36px 10px 12px', borderRadius: '8px', border: '1px solid #ededed', background: '#f5f5f5', color: '#111', fontSize: '16px', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#2966f4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(41,102,244,0.25)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#ededed'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} aria-hidden style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#737373', pointerEvents: 'none' }} />
                  </div>

                  {/* Subject */}
                  <label htmlFor="sw-subject" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                    Subject
                  </label>
                  <input
                    id="sw-subject"
                    type="text"
                    placeholder="Brief subject…"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{ width: '100%', minHeight: 44, padding: '10px', borderRadius: '8px', border: '1px solid #ededed', background: '#fff', color: '#111', fontSize: '16px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2966f4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(41,102,244,0.25)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#ededed'; e.currentTarget.style.boxShadow = 'none'; }}
                  />

                  {/* Message */}
                  <label htmlFor="sw-message" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                    Message
                  </label>
                  <textarea
                    id="sw-message"
                    placeholder="Describe the issue in as much detail as possible…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ededed', background: '#fff', color: '#111', fontSize: '16px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 96, boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2966f4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(41,102,244,0.25)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#ededed'; e.currentTarget.style.boxShadow = 'none'; }}
                  />

                  {/* Error */}
                  {error && (
                    <div role="alert" style={{ display: 'flex', gap: '6px', padding: '8px 10px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AlertCircle size={12} color="#dc2626" aria-hidden style={{ flexShrink: 0, marginTop: '1px' }} />
                      <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: 44, padding: '10px', borderRadius: '8px', background: loading ? '#93b4fa' : '#2966f4', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', transition: 'background 0.15s', touchAction: 'manipulation' }}
                  >
                    {loading
                      ? <><div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />Sending…</>
                      : <><Send size={12} />Send ticket</>
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}