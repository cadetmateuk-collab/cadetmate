'use client';

import { createPortal } from 'react-dom';
import { useEscapeKey } from '@/lib/a11y/useEscapeKey';
import { useBodyScrollLock } from '@/lib/a11y/useBodyScrollLock';

export default function AdminModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEscapeKey(true, onClose);
  useBodyScrollLock(true);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[hsl(var(--ink-navy)/0.5)] backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>,
    document.body,
  );
}
