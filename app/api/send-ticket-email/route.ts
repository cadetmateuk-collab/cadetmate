import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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
    const body = await req.json()
    const { type } = body

    if (type === 'status_update') {
      return await handleStatusUpdate(body)
    }

    return await handleNewTicket(body)

  } catch (err: any) {
    console.error('Send ticket email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── New ticket ────────────────────────────────────────────────────────────────
async function handleNewTicket(body: any) {
  const { userEmail, userName, subject, message, ticketId } = body

  if (!userEmail || !subject || !message || !ticketId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const t = createTransporter()

  // Confirmation to user
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
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">We've got your message, ${userName ?? 'there'}!</h2>
        <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
          Thanks for reaching out. We've received your support ticket and will get back to you as soon as possible.
          You can reply directly to this email if you have anything to add.
        </p>
        <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px;margin-bottom:24px">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#737373;margin:0 0 6px">Your message</p>
          <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px">${subject}</p>
          <p style="font-size:13px;color:#555;margin:0;line-height:1.6;white-space:pre-wrap">${message}</p>
        </div>
        <p style="font-size:11px;color:#aaa;margin:0 0 24px">Ticket ID: ${ticketId}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px" />
        <p style="font-size:11px;color:#aaa;margin:0">CadetMate · <a href="https://cadetmate.co.uk" style="color:#2966f4;text-decoration:none">cadetmate.co.uk</a></p>
      </div>
    `,
  })

  // Notification to admin
  await t.sendMail({
    from:    FROM(),
    to:      ADMIN(),
    replyTo: userEmail,
    subject: `[Support Ticket] ${subject}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee">
          <span style="font-size:14px;font-weight:800">CadetMate</span>
          <span style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:99px;margin-left:8px">New Ticket</span>
        </div>
        <h2 style="font-size:16px;font-weight:700;margin:0 0 16px">New Support Ticket</h2>
        <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#737373;width:80px;vertical-align:top">From</td><td style="padding:6px 0;font-weight:600">${userName ?? 'Unknown'} &lt;${userEmail}&gt;</td></tr>
          <tr><td style="padding:6px 0;color:#737373;vertical-align:top">Subject</td><td style="padding:6px 0;font-weight:600">${subject}</td></tr>
          <tr><td style="padding:6px 0;color:#737373;vertical-align:top">Ticket&nbsp;ID</td><td style="padding:6px 0;font-family:monospace;font-size:11px;color:#737373">${ticketId}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px;margin-bottom:20px">
          <p style="font-size:13px;color:#333;margin:0;line-height:1.6;white-space:pre-wrap">${message}</p>
        </div>
        <p style="font-size:12px;color:#aaa;margin:0">Hit <strong>Reply</strong> to respond directly to ${userEmail}.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}

// ── Status update ─────────────────────────────────────────────────────────────
async function handleStatusUpdate(body: any) {
  const { userEmail, userName, subject, ticketId, newStatus } = body

  if (!userEmail || !ticketId || !newStatus) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const statusInfo = STATUS_LABELS[newStatus] ?? { label: newStatus, color: '#737373', description: 'Your ticket status has been updated.' }
  const t = createTransporter()

  await t.sendMail({
    from:    FROM(),
    to:      userEmail,
    replyTo: ADMIN(),
    // Use Re: so it threads in the user's email client
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em">CadetMate</span>
          <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#eef2fe;color:#2966f4;padding:2px 8px;border-radius:99px;margin-left:8px">Support</span>
        </div>

        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">Ticket status updated</h2>
        <p style="font-size:14px;color:#555;margin:0 0 20px;line-height:1.6">
          Hi ${userName ?? 'there'}, your support ticket status has changed.
        </p>

        <div style="border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid ${statusInfo.color}33;background:${statusInfo.color}0d">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#737373;margin:0 0 6px">New Status</p>
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:${statusInfo.color}1a;margin-bottom:10px">
            <span style="width:7px;height:7px;border-radius:50%;background:${statusInfo.color};display:inline-block"></span>
            <span style="font-size:12px;font-weight:700;color:${statusInfo.color};text-transform:uppercase;letter-spacing:0.05em">${statusInfo.label}</span>
          </div>
          <p style="font-size:13px;color:#555;margin:0;line-height:1.6">${statusInfo.description}</p>
        </div>

        <div style="background:#f5f5f5;border-radius:10px;padding:12px 16px;margin-bottom:24px">
          <p style="font-size:11px;color:#737373;margin:0 0 2px">Your original subject</p>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0">${subject}</p>
        </div>

        <p style="font-size:13px;color:#555;margin:0 0 24px;line-height:1.6">
          If you have any further questions, simply reply to this email and we'll pick it up straight away.
        </p>

        <p style="font-size:11px;color:#aaa;margin:0 0 24px">Ticket ID: ${ticketId}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px" />
        <p style="font-size:11px;color:#aaa;margin:0">CadetMate · <a href="https://cadetmate.co.uk" style="color:#2966f4;text-decoration:none">cadetmate.co.uk</a></p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}