import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, userEmail } = await request.json();

    if (!pdfUrl || !userEmail) {
      return NextResponse.json(
        { error: 'PDF URL and user email are required' },
        { status: 400 }
      );
    }

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Bottom license text
      page.drawText(
        `© CadetMate. Licensed exclusively to ${userEmail} for personal use only. Redistribution prohibited.`,
        {
          x: 20,
          y: 10,
          size: 8,
          font,
          color: rgb(1, 0, 0),
          opacity: 0.5,
        }
      );

      // Centered diagonal watermark
      const fontSize = 40;
      const angle = degrees(45);

      const textWidth = font.widthOfTextAtSize(userEmail, fontSize);
      const textHeight = fontSize;

      const centerX = width / 2;
      const centerY = height / 2;

      const radians = Math.PI / 4;

      const rotatedWidth =
        Math.abs(textWidth * Math.cos(radians)) +
        Math.abs(textHeight * Math.sin(radians));

      const rotatedHeight =
        Math.abs(textWidth * Math.sin(radians)) +
        Math.abs(textHeight * Math.cos(radians));

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
      },
    });
  } catch (error: any) {
    console.error('PDF watermarking error:', error);
    return NextResponse.json(
      { error: 'Failed to watermark PDF', details: error.message },
      { status: 500 }
    );
  }
}
