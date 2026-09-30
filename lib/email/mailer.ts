import nodemailer from 'nodemailer';

export function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function mailFrom(): string {
  const name = process.env.SMTP_FROM_NAME?.trim() || 'CadetMate';
  const email = process.env.SMTP_FROM_EMAIL?.trim();
  if (!email) {
    throw new Error('Missing SMTP_FROM_EMAIL');
  }
  return `${name} <${email}>`;
}

export function mailAdmin(): string {
  const admin = process.env.SMTP_ADMIN_EMAIL?.trim();
  if (!admin) {
    throw new Error('Missing SMTP_ADMIN_EMAIL');
  }
  return admin;
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM_EMAIL &&
      process.env.SMTP_ADMIN_EMAIL,
  );
}
