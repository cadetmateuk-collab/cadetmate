'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, Lock, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscribeButton } from '@/components/billing/SubscribeButton';
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';
import { useEscapeKey } from '@/lib/a11y/useEscapeKey';
import { useBodyScrollLock } from '@/lib/a11y/useBodyScrollLock';
import type { PremiumPrice } from '@/lib/stripe/premium-price';

interface PremiumLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumLockModal({ isOpen, onClose }: PremiumLockModalProps) {
  const [price, setPrice] = useState<PremiumPrice | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(isOpen, dialogRef, closeRef);
  useEscapeKey(isOpen, onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    void import('@/lib/analytics').then(({ trackEvent }) => {
      trackEvent('premium_lock_view', { location: 'premium_lock_modal' });
    });
    fetch('/api/premium-price')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PremiumPrice | null) => {
        if (data?.formatted) setPrice(data);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-0 sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg max-h-[min(92dvh,900px)] overflow-y-auto overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-lock-title"
      >
        <div className="relative bg-blue-600 text-white p-5 sm:p-8 rounded-t-2xl sm:rounded-t-xl">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex h-11 w-11 items-center justify-center hover:bg-white/20 rounded-lg transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close"
          >
            <X size={22} aria-hidden />
          </button>
          <div className="flex items-start sm:items-center gap-3 pr-12">
            <Lock className="size-7 sm:size-8 shrink-0 mt-0.5 sm:mt-0" aria-hidden />
            <h2 id="premium-lock-title" className="text-h2 sm:text-3xl font-bold text-white text-balance leading-tight">
              Premium Content Locked
            </h2>
          </div>
          <p className="text-blue-50 mt-2 text-sm sm:text-base">
            Unlock full access to training modules and simulators
          </p>
        </div>

        <div className="p-5 sm:p-8">
          <div className="mb-6 space-y-3">
            {[
              ['All Unit Modules', 'Complete access to maritime training modules'],
              ['Bridge & buoyage sims', 'Premium simulator access'],
              ['TRB & Sea Survival', 'Training record book and safety content'],
            ].map(([title, body]) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1" aria-hidden>
                  <Sparkles size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">CadetMate Premium</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {price?.formattedWithInterval ?? 'See store'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Flashcard packs are sold separately in the store.</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-11 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Maybe Later
            </button>
            <SubscribeButton
              className="flex-1 min-h-11"
              label={price ? `Subscribe · ${price.formatted}` : 'Subscribe'}
            />
          </div>
          <Button variant="ghost" className="w-full mt-2" asChild>
            <Link href="/store" onClick={onClose}>
              <Crown className="h-4 w-4" /> Open store for flashcard packs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
