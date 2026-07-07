'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProtectedToolBarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export function ProtectedToolBar({
  title,
  backHref = '/dashboard',
  backLabel = 'Back to app',
}: ProtectedToolBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-4 py-2 backdrop-blur-md">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/70">{title}</p>
      <div className="w-[88px]" aria-hidden />
    </div>
  );
}
