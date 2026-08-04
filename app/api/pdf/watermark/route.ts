import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { getAllowedPdfHosts } from '@/lib/security/env';

export const runtime = 'nodejs';

function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  // Block obvious private IPv4
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(h)) return true;
  return false;
}

function assertAllowedPdfUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid PDF URL');
  }
  if (url.protocol !== 'https:') {
    throw new Error('PDF URL must use HTTPS');
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error('PDF host not allowed');
  }
  const allowed = getAllowedPdfHosts();
  const host = url.hostname.toLowerCase();
  const ok = allowed.some(
    (a) => host === a || (a.startsWith('*.') && host.endsWith(a.slice(1))) || host.endsWith(`.${a}`),
  );
  if (!ok) {
    throw new Error('PDF host not allowlisted');
  }
  return url;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();
    const pdfUrl = typeof body.pdfUrl === 'string' ? body.pdfUrl : '';
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }

    const allowedUrl = assertAllowedPdfUrl(pdfUrl);
    const userEmail = user.email ?? 'licensed-user';

    const pdfResponse = await fetch(allowedUrl.toString(), {
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }

    const contentType = pdfResponse.headers.get('content-type') ?? '';
    if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      throw new Error('URL did not return a PDF');
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    if (pdfBytes.byteLength > 25 * 1024 * 1024) {
      throw new Error('PDF too large');
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      page.drawText(
        `© CadetMate. Licensed exclusively to ${userEmail} for personal use only. Redistribution prohibited.`,
        {
          x: 20,
          y: 10,
          size: 8,
          font,
          color: rgb(1, 0, 0),
          opacity: 0.5,
        },
      );

      const fontSize = 40;
      const angle = degrees(45);
      const textWidth = font.widthOfTextAtSize(userEmail, fontSize);
      const textHeight = fontSize;
      const centerX = width / 2;
      const centerY = height / 2;
      const radians = Math.PI / 4;
      const rotatedWidth =
        Math.abs(textWidth * Math.cos(radians)) + Math.abs(textHeight * Math.sin(radians));
      const rotatedHeight =
        Math.abs(textWidth * Math.sin(radians)) + Math.abs(textHeight * Math.cos(radians));
      const x = centerX - rotatedWidth / 2;
      const y = centerY - rotatedHeight / 2;

      page.drawText(userEmail, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(1, 0, 0),
        opacity: 0.5,
        rotate: angle,
      });
    }

    const watermarkedPdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(watermarkedPdfBytes);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="watermarked.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('PDF watermarking error:', error);
    const message = error instanceof Error ? error.message : 'Failed to watermark PDF';
    const status =
      message.includes('allowlist') ||
      message.includes('HTTPS') ||
      message.includes('Invalid') ||
      message.includes('not allowed')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
