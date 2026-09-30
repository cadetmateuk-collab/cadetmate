'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { passwordStrength, type PasswordStrength } from '@/lib/onboarding/constants';

type Props = {
  password: string;
  confirmPassword: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
};

const STRENGTH_META: Record<PasswordStrength, { label: string; width: string; color: string }> = {
  weak: { label: 'Weak', width: 'w-1/4', color: 'bg-red-500' },
  fair: { label: 'Fair', width: 'w-2/4', color: 'bg-amber-500' },
  good: { label: 'Good', width: 'w-3/4', color: 'bg-blue-500' },
  strong: { label: 'Strong', width: 'w-full', color: 'bg-emerald-500' },
};

export function PasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const strength = password ? passwordStrength(password) : null;
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="ob-password">Password</Label>
        <div className="relative">
          <Input
            id="ob-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="h-12 pr-11 border-2"
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {strength && (
          <div className="space-y-1.5 pt-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', STRENGTH_META[strength].width, STRENGTH_META[strength].color)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Strength: <span className="font-medium text-foreground">{STRENGTH_META[strength].label}</span>
              {password.length < 8 ? ' · At least 8 characters' : ''}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ob-confirm">Confirm password</Label>
        <div className="relative">
          <Input
            id="ob-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => onConfirmChange(e.target.value)}
            className={cn('h-12 pr-11 border-2', mismatch && 'border-destructive')}
            aria-invalid={mismatch}
          />
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {mismatch && (
          <p className="text-xs text-destructive" role="alert">
            Passwords do not match
          </p>
        )}
      </div>
    </div>
  );
}
