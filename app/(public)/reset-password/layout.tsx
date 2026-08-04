import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Reset Password', '/reset-password');

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
