import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { escapeHtml } from '@/lib/security/env';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { createMailTransporter, isMailConfigured, mailAdmin, mailFrom } from '@/lib/email/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!(await rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later or email us directly.' },
        { status: 429 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
    if (honeypot) {
      return NextResponse.json({ ok: true });
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : '';

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!isMailConfigured()) {
      console.error('Contact form: SMTP is not configured');
      return NextResponse.json(
        { error: 'Email is temporarily unavailable. Please use the support address instead.' },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let ticketId: string | null = null;
    if (user) {
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          email,
          subject: `[Contact] ${name}`,
          message,
        })
        .select('id')
        .single();

      if (ticketErr) {
        console.error('Contact ticket insert error:', ticketErr);
      } else {
        ticketId = ticket?.id ?? null;
      }
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);
    const safeTicket = ticketId ? escapeHtml(ticketId) : null;
    const t = createMailTransporter();

    await t.sendMail({
      from: mailFrom(),
      to: mailAdmin(),
      replyTo: email,
      subject: `[Contact] ${name}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
          <h2 style="font-size:16px;font-weight:700;margin:0 0 16px">New contact form message</h2>
          <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:6px 0;color:#737373;width:80px">From</td><td style="padding:6px 0;font-weight:600">${safeName} &lt;${safeEmail}&gt;</td></tr>
            ${safeTicket ? `<tr><td style="padding:6px 0;color:#737373">Ticket ID</td><td style="padding:6px 0;font-family:monospace;font-size:11px">${safeTicket}</td></tr>` : ''}
          </table>
          <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px">
            <p style="font-size:13px;color:#333;margin:0;line-height:1.6;white-space:pre-wrap">${safeMessage}</p>
          </div>
        </div>
      `,
    });

    await t.sendMail({
      from: mailFrom(),
      to: email,
      replyTo: mailAdmin(),
      subject: 'We received your message — CadetMate',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em">CadetMate</span>
          <h2 style="font-size:18px;font-weight:700;margin:16px 0 8px">Thanks, ${safeName}</h2>
          <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
            We have received your message and will get back to you as soon as we can.
          </p>
          <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px">
            <p style="font-size:13px;color:#555;margin:0;line-height:1.6;white-space:pre-wrap">${safeMessage}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, ticketId });
  } catch (err: unknown) {
    console.error('Contact form error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
