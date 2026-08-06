'use client';

import { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';
import { useEscapeKey } from '@/lib/a11y/useEscapeKey';
import { useBodyScrollLock } from '@/lib/a11y/useBodyScrollLock';

type Props = {
  isOpen: boolean;
  onContinueAsUser: () => void;
  onContinueAsDeveloper: () => void;
};

export function DeveloperGateModal({ isOpen, onContinueAsUser, onContinueAsDeveloper }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(isOpen, dialogRef, primaryRef);
  useEscapeKey(isOpen, onContinueAsUser);
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinueAsUser();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-gate-title"
        aria-describedby="dev-gate-desc"
        className="bg-card text-card-foreground rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-2 min-w-0">
              <h2 id="dev-gate-title" className="text-xl font-bold tracking-tight text-foreground">
                Are you a developer?
              </h2>
              <p id="dev-gate-desc" className="text-sm text-muted-foreground leading-relaxed">
                This environment is connected to the production database.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose <strong>I&apos;m a Developer</strong> to preview the onboarding UI only —
                no accounts, emails, or auth requests will be created.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={onContinueAsDeveloper}
            >
              I&apos;m a Developer
            </Button>
            <button
              ref={primaryRef}
              type="button"
              className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 touch-manipulation transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              onClick={onContinueAsUser}
            >
              I&apos;m a User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
