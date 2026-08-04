import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'
import { escapeHtml } from '@/lib/security/env'

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const FROM      = () => `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`
const ADMIN     = () => process.env.SMTP_ADMIN_EMAIL!

const STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
  open:        { label: 'Open',        color: '#dc2626', description: "Your ticket has been reopened and is awaiting a response." },
  in_progress: { label: 'In Progress', color: '#d97706', description: "We're actively looking into your ticket and will update you shortly." },
  resolved:    { label: 'Resolved',    color: '#16a34a', description: "We've resolved your ticket. If you're still experiencing issues, please reply to this email." },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    if (type === 'status_update') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return await handleStatusUpdate(body)
    }

    return await handleNewTicket(body, user.id, user.email)

  } catch (err: unknown) {
    console.error('Send ticket email error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleNewTicket(
  body: Record<string, unknown>,
  userId: string,
  sessionEmail: string | undefined,
) {
  const ticketId = typeof body.ticketId === 'string' ? body.ticketId : ''
  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 500) : ''
  const message = typeof body.message === 'string' ? body.message.slice(0, 10000) : ''
  const userName = typeof body.userName === 'string' ? body.userName.slice(0, 200) : 'Cadet'

  if (!subject || !message || !ticketId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify ticket belongs to caller — never trust client email
  const supabase = await createClient()
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, email, user_id')
    .eq('id', ticketId)
    .maybeSingle()

  if (!ticket || ticket.user_id !== userId) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  const userEmail = ticket.email || sessionEmail
  if (!userEmail) {
    return NextResponse.json({ error: 'No email on ticket' }, { status: 400 })
  }

  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)
  const safeName = escapeHtml(userName)
  const safeEmail = escapeHtml(userEmail)
  const safeTicketId = escapeHtml(ticketId)

  const t = createTransporter()

  await t.sendMail({
    from:    FROM(),
    to:      userEmail,
    replyTo: ADMIN(),
    subject: `We received your support request — ${subject}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em">CadetMate</span>
          <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#eef2fe;color:#2966f4;padding:2px 8px;border-radius:99px;margin-left:8px">Support</span>
        </div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">We've got your message, ${safeName}!</h2>
        <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
          Thanks for reaching out. We've received your support ticket and will get back to you as soon as possible.
        </p>
        <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px;margin-bottom:24px">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#737373;margin:0 0 6px">Your message</p>
          <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px">${safeSubject}</p>
          <p style="font-size:13px;color:#555;margin:0;line-height:1.6;white-space:pre-wrap">${safeMessage}</p>
        </div>
        <p style="font-size:11px;color:#aaa;margin:0 0 24px">Ticket ID: ${safeTicketId}</p>
      </div>
    `,
  })

  await t.sendMail({
    from:    FROM(),
    to:      ADMIN(),
    replyTo: userEmail,
    subject: `[Support Ticket] ${subject}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <h2 style="font-size:16px;font-weight:700;margin:0 0 16px">New Support Ticket</h2>
        <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#737373;width:80px">From</td><td style="padding:6px 0;font-weight:600">${safeName} &lt;${safeEmail}&gt;</td></tr>
          <tr><td style="padding:6px 0;color:#737373">Subject</td><td style="padding:6px 0;font-weight:600">${safeSubject}</td></tr>
          <tr><td style="padding:6px 0;color:#737373">Ticket ID</td><td style="padding:6px 0;font-family:monospace;font-size:11px">${safeTicketId}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px">
          <p style="font-size:13px;color:#333;margin:0;line-height:1.6;white-space:pre-wrap">${safeMessage}</p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}

async function handleStatusUpdate(body: Record<string, unknown>) {
  const userEmail = typeof body.userEmail === 'string' ? body.userEmail : ''
  const userName = typeof body.userName === 'string' ? body.userName.slice(0, 200) : 'there'
  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 500) : 'Your support ticket'
  const ticketId = typeof body.ticketId === 'string' ? body.ticketId : ''
  const newStatus = typeof body.newStatus === 'string' ? body.newStatus : ''

  if (!userEmail || !ticketId || !newStatus || !STATUS_LABELS[newStatus]) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const statusInfo = STATUS_LABELS[newStatus]
  const t = createTransporter()
  const safeName = escapeHtml(userName)
  const safeSubject = escapeHtml(subject)
  const safeTicketId = escapeHtml(ticketId)

  await t.sendMail({
    from:    FROM(),
    to:      userEmail,
    replyTo: ADMIN(),
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">Ticket status updated</h2>
        <p style="font-size:14px;color:#555;margin:0 0 20px;line-height:1.6">
          Hi ${safeName}, your support ticket status has changed to <strong>${escapeHtml(statusInfo.label)}</strong>.
        </p>
        <p style="font-size:13px;color:#555;margin:0 0 16px">${escapeHtml(statusInfo.description)}</p>
        <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 8px">${safeSubject}</p>
        <p style="font-size:11px;color:#aaa;margin:0">Ticket ID: ${safeTicketId}</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
