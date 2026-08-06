'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { MOTION } from '@/lib/motion/constants';
import { cn } from '@/lib/utils';
import {
  INITIAL_ONBOARDING_DATA,
  LEARNING_INTERESTS,
  ONBOARDING_STEPS,
  REFERRAL_SOURCES,
  TRAINING_PHASES,
  isValidEmail,
  isValidPhone,
  labelForPhase,
  labelForReferral,
  labelsForInterests,
  type OnboardingData,
  type OnboardingStep,
} from '@/lib/onboarding/constants';
import { AvatarPicker } from './AvatarPicker';
import { CollegeCombobox } from './CollegeCombobox';
import { PasswordFields } from './PasswordFields';
import { UserAvatar } from './UserAvatar';

type Props = {
  onBackToLogin: () => void;
  /** Developer preview — walk the UI with zero auth / signup requests */
  isTestFlow?: boolean;
};

const PROGRESS_STEPS = ONBOARDING_STEPS.filter((s) => s !== 'verify');

export function OnboardingWizard({ onBackToLogin, isTestFlow = false }: Props) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const progressIndex = PROGRESS_STEPS.indexOf(step as (typeof PROGRESS_STEPS)[number]);
  const progress =
    step === 'verify'
      ? 1
      : Math.max(0, progressIndex) / Math.max(1, PROGRESS_STEPS.length - 1);

  const patch = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setError(null);
  }, []);

  const goTo = useCallback((next: OnboardingStep, dir = 1) => {
    setDirection(dir);
    setError(null);
    setStep(next);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    const id = requestAnimationFrame(() => primaryInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [step]);

  async function validateAndAdvance() {
    setError(null);

    switch (step) {
      case 'welcome':
        goTo('name');
        return;
      case 'name': {
        if (data.fullName.trim().length < 2) {
          setError('Please enter your full name.');
          return;
        }
        goTo('email');
        return;
      }
      case 'email': {
        const email = data.email.trim().toLowerCase();
        if (!isValidEmail(email)) {
          setError('Please enter a valid email address.');
          return;
        }
        if (isTestFlow) {
          patch({ email });
          goTo('avatar');
          return;
        }
        setLoading(true);
        try {
          const res = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Could not verify email');
          if (!json.available) {
            setError('This email is already in use. Try signing in instead.');
            return;
          }
          patch({ email });
          goTo('avatar');
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : 'Could not verify email');
        } finally {
          setLoading(false);
        }
        return;
      }
      case 'avatar':
        if (data.avatarKind === 'preset' && !data.avatarPreset) {
          setError('Please choose a profile photo or initials.');
          return;
        }
        goTo('password');
        return;
      case 'password': {
        if (data.password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }
        if (data.password !== data.confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        goTo('phone');
        return;
      }
      case 'phone': {
        if (!isValidPhone(data.phoneNumber)) {
          setError('Enter a valid phone number, or leave it blank to skip.');
          return;
        }
        goTo('phase');
        return;
      }
      case 'phase':
        if (!data.trainingPhase) {
          setError('Please select your training phase.');
          return;
        }
        goTo('college');
        return;
      case 'college':
        if (!data.nauticalCollege.trim()) {
          setError('Please select or enter your college.');
          return;
        }
        goTo('interests');
        return;
      case 'interests':
        if (data.learningInterests.length === 0) {
          setError('Select at least one topic.');
          return;
        }
        goTo('referral');
        return;
      case 'referral':
        if (!data.referralSource) {
          setError('Please tell us how you heard about us.');
          return;
        }
        goTo('review');
        return;
      case 'review':
        if (!data.acceptedTerms) {
          setError('Please accept the Terms & Conditions to continue.');
          return;
        }
        await createAccount();
        return;
      default:
        return;
    }
  }

  function goBack() {
    const order = [...ONBOARDING_STEPS];
    const idx = order.indexOf(step);
    if (idx <= 0) {
      onBackToLogin();
      return;
    }
    if (step === 'verify') return;
    goTo(order[idx - 1], -1);
  }

  async function createAccount() {
    setLoading(true);
    setError(null);

    // Developer preview: no auth, signup, or email requests — UI only.
    if (isTestFlow) {
      await new Promise((r) => setTimeout(r, 400));
      setLoading(false);
      goTo('verify');
      return;
    }

    const supabase = createClient();
    const email = data.email.trim().toLowerCase();
    const phone = data.phoneNumber.trim();

    const metadata = {
      full_name: data.fullName.trim(),
      training_phase: data.trainingPhase,
      nautical_college: data.nauticalCollege.trim(),
      learning_interests: data.learningInterests,
      referral_source: data.referralSource,
      avatar_kind: data.avatarKind,
      avatar_preset: data.avatarKind === 'preset' ? data.avatarPreset : null,
      phone_number: phone || null,
      whatsapp_opt_in: Boolean(phone),
      onboarding_completed: true,
    };

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (signUpError) throw signUpError;

      try {
        const { trackConversion, trackEvent } = await import('@/lib/analytics');
        trackConversion('sign_up', { method: 'email', user_id: signUpData.user?.id });
        trackEvent('form_submit', { form_name: 'auth_onboarding', status: 'success' });
      } catch {
        /* analytics optional */
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const res = await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: metadata.full_name,
            training_phase: metadata.training_phase,
            nautical_college: metadata.nautical_college,
            learning_interests: metadata.learning_interests,
            referral_source: metadata.referral_source,
            avatar_kind: metadata.avatar_kind,
            avatar_preset: metadata.avatar_preset,
            phone_number: metadata.phone_number,
            whatsapp_opt_in: metadata.whatsapp_opt_in,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          console.warn('[onboarding] profile sync:', json.error);
        }
      }

      goTo('verify');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (isTestFlow) {
      setResendCooldown(60);
      return;
    }
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: data.email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (resendError) throw resendError;
      setResendCooldown(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not resend email');
    } finally {
      setLoading(false);
    }
  }

  async function submitChangeEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const check = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const checkJson = await check.json();
      if (!check.ok) throw new Error(checkJson.error || 'Could not verify email');
      if (!checkJson.available) {
        setError('This email is already in use.');
        return;
      }

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { error: updateError } = await supabase.auth.updateUser({ email });
        if (updateError) throw updateError;
      } else {
        // No session yet — take user back to email step with new address.
        patch({ email, password: '', confirmPassword: '' });
        setChangingEmail(false);
        goTo('email', -1);
        setError('Update your password and create the account again with the new email.');
        return;
      }

      patch({ email });
      setChangingEmail(false);
      setNewEmail('');
      setResendCooldown(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not change email');
    } finally {
      setLoading(false);
    }
  }

  function toggleInterest(id: string) {
    const set = new Set(data.learningInterests);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patch({ learningInterests: [...set] });
  }

  const canContinue =
    !loading &&
    (step === 'welcome' ||
      step === 'name' ||
      step === 'avatar' ||
      step === 'email' ||
      step === 'password' ||
      step === 'phone' ||
      step === 'phase' ||
      step === 'college' ||
      step === 'interests' ||
      step === 'referral' ||
      step === 'review');

  return (
    <div
      className="flex flex-col"
      style={{ width: 'min(26rem, calc(100vw - 2rem))', height: '36rem' }}
    >
      <div className="flex h-11 shrink-0 items-center justify-between">
        {step !== 'verify' ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            aria-label={step === 'welcome' ? 'Back to sign in' : 'Previous step'}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-11" />
        )}
        <div className="relative h-10 w-10">
          <Image src="/images/logo.webp" alt="Cadet Mate" fill className="object-contain" sizes="40px" />
        </div>
        <span className="w-11" />
      </div>

      <div className="mb-4 mt-4 h-10 shrink-0 space-y-2">
        {step !== 'verify' ? (
          <>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: MOTION.duration.base, ease: MOTION.ease }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center tabular-nums">
              Step {Math.max(1, progressIndex + 1)} of {PROGRESS_STEPS.length}
            </p>
          </>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -16 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease }}
            className="absolute inset-0 overflow-y-auto overscroll-contain pr-0.5"
          >
          {step === 'welcome' && (
            <StepShell
              title="Welcome to CadetMate"
              subtitle="Your companion for maritime training — flashcards, COLREGS, orals prep, and more."
            >
              <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 text-sm text-muted-foreground leading-relaxed">
                We&apos;ll ask a few quick questions so we can tailor your experience. It only takes a minute.
              </div>
            </StepShell>
          )}

          {step === 'name' && (
            <StepShell title="What's your name?" subtitle="This is how we'll greet you in the app.">
              <Label htmlFor="ob-name" className="sr-only">Full name</Label>
              <Input
                ref={primaryInputRef}
                id="ob-name"
                value={data.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                placeholder="Full name"
                className="h-12 border-2 text-base"
                autoComplete="name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void validateAndAdvance();
                  }
                }}
              />
            </StepShell>
          )}

          {step === 'email' && (
            <StepShell
              title="What's your email?"
              subtitle={
                isTestFlow
                  ? 'Preview only — nothing will be saved or emailed.'
                  : "We'll send a verification link here."
              }
            >
              <Label htmlFor="ob-email" className="sr-only">Email</Label>
              <Input
                ref={primaryInputRef}
                id="ob-email"
                type="email"
                value={data.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="name@example.com"
                className="h-12 border-2 text-base"
                autoComplete="email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void validateAndAdvance();
                  }
                }}
              />
            </StepShell>
          )}

          {step === 'avatar' && (
            <StepShell title="Pick a profile picture" subtitle="Initials or a photo — tap to select.">
              <AvatarPicker
                fullName={data.fullName}
                avatarKind={data.avatarKind}
                avatarPreset={data.avatarPreset}
                onChange={(kind, preset) => patch({ avatarKind: kind, avatarPreset: preset })}
              />
            </StepShell>
          )}

          {step === 'password' && (
            <StepShell title="Create a password" subtitle="Use at least 8 characters.">
              <PasswordFields
                password={data.password}
                confirmPassword={data.confirmPassword}
                onPasswordChange={(v) => patch({ password: v })}
                onConfirmChange={(v) => patch({ confirmPassword: v })}
              />
            </StepShell>
          )}

          {step === 'phone' && (
            <StepShell
              title="Join our WhatsApp group?"
              subtitle="Optional — add your number if you'd like an invite to the CadetMate community."
            >
              <div className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                  <Label htmlFor="ob-phone" className="sr-only">Phone number</Label>
                  <Input
                    ref={primaryInputRef}
                    id="ob-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={data.phoneNumber}
                    onChange={(e) => patch({ phoneNumber: e.target.value })}
                    placeholder="+44 7xxx xxx xxx"
                    className="h-12 border-2 pl-10 text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void validateAndAdvance();
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Leave blank to skip. We&apos;ll only use this to send a WhatsApp group invite.
                </p>
                <button
                  type="button"
                  className="w-full text-sm font-medium text-primary hover:underline py-2"
                  onClick={() => {
                    patch({ phoneNumber: '' });
                    goTo('phase');
                  }}
                >
                  Skip for now
                </button>
              </div>
            </StepShell>
          )}

          {step === 'phase' && (
            <StepShell title="What phase are you currently in?" subtitle="Helps us recommend the right material.">
              <OptionGrid
                options={TRAINING_PHASES.map((p) => ({ id: p.id, label: p.label }))}
                value={data.trainingPhase}
                onChange={(id) => patch({ trainingPhase: id })}
              />
            </StepShell>
          )}

          {step === 'college' && (
            <StepShell title="Which nautical college do you attend?" subtitle="Search the list or enter your own.">
              <CollegeCombobox
                value={data.nauticalCollege}
                onChange={(v) => patch({ nauticalCollege: v })}
              />
            </StepShell>
          )}

          {step === 'interests' && (
            <StepShell title="What would you like to learn about?" subtitle="Select as many as you like.">
              <div className="flex flex-wrap gap-2">
                {LEARNING_INTERESTS.map((item) => {
                  const selected = data.learningInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(item.id)}
                      className={cn(
                        'rounded-full px-4 py-2.5 text-sm font-medium border transition-colors touch-manipulation',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:border-primary/40 hover:bg-primary/5',
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 'referral' && (
            <StepShell title="How did you hear about us?" subtitle="Optional for you — useful for us.">
              <OptionGrid
                options={REFERRAL_SOURCES.map((r) => ({ id: r.id, label: r.label }))}
                value={data.referralSource}
                onChange={(id) => patch({ referralSource: id })}
              />
            </StepShell>
          )}

          {step === 'review' && (
            <StepShell title="Looking good" subtitle="Review your details before creating your account.">
              <div className="space-y-3">
                <ReviewRow
                  label="Profile"
                  onEdit={() => goTo('avatar', -1)}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      fullName={data.fullName}
                      avatarKind={data.avatarKind}
                      avatarPreset={data.avatarPreset}
                      size={44}
                    />
                    <div>
                      <p className="font-medium">{data.fullName}</p>
                      <p className="text-xs text-muted-foreground">{data.email}</p>
                    </div>
                  </div>
                </ReviewRow>
                {data.phoneNumber.trim() ? (
                  <ReviewRow label="WhatsApp" onEdit={() => goTo('phone', -1)}>
                    {data.phoneNumber.trim()}
                  </ReviewRow>
                ) : null}
                <ReviewRow label="Training phase" onEdit={() => goTo('phase', -1)}>
                  {labelForPhase(data.trainingPhase)}
                </ReviewRow>
                <ReviewRow label="College" onEdit={() => goTo('college', -1)}>
                  {data.nauticalCollege}
                </ReviewRow>
                <ReviewRow label="Interests" onEdit={() => goTo('interests', -1)}>
                  {labelsForInterests(data.learningInterests).join(', ')}
                </ReviewRow>
                <ReviewRow label="Referral" onEdit={() => goTo('referral', -1)}>
                  {labelForReferral(data.referralSource)}
                </ReviewRow>

                <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={data.acceptedTerms}
                    onChange={(e) => patch({ acceptedTerms: e.target.checked })}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    I accept the{' '}
                    <Link
                      href="/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </StepShell>
          )}

          {step === 'verify' && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                {isTestFlow ? <CheckCircle2 className="h-8 w-8" aria-hidden /> : <Mail className="h-8 w-8" aria-hidden />}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  {isTestFlow ? 'Preview complete' : 'Check your inbox'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isTestFlow ? (
                    <>
                      Developer test mode — no account was created and no emails were sent.
                    </>
                  ) : (
                    <>
                      We&apos;ve sent you a verification email.
                      <br />
                      Please verify your email before continuing.
                    </>
                  )}
                </p>
                {!isTestFlow && (
                  <p className="text-sm font-medium text-foreground pt-1">{data.email}</p>
                )}
              </div>

              {isTestFlow ? (
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <Button type="button" onClick={onBackToLogin}>
                    Back to sign in
                  </Button>
                </div>
              ) : changingEmail ? (
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <Label htmlFor="ob-new-email">New email address</Label>
                  <Input
                    id="ob-new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-12 border-2"
                    placeholder="new@example.com"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setChangingEmail(false);
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="button" className="flex-1" disabled={loading} onClick={() => void submitChangeEmail()}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update email'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || resendCooldown > 0}
                    onClick={() => void resendVerification()}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>
                  <button
                    type="button"
                    className="text-sm text-primary font-medium hover:underline"
                    onClick={() => {
                      setChangingEmail(true);
                      setNewEmail(data.email);
                      setError(null);
                    }}
                  >
                    Change email address
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={onBackToLogin}
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      </div>

      <div className="mt-4 flex h-[4.5rem] shrink-0 flex-col justify-end">
        <div className="mb-1 h-5 shrink-0">
          {error ? (
            <div role="alert" className="truncate text-center text-xs text-red-600">
              {error}
            </div>
          ) : null}
        </div>
        {canContinue ? (
          <Button
            type="button"
            className="w-full h-12 shrink-0 text-base font-semibold"
            disabled={loading || (step === 'review' && !data.acceptedTerms)}
            onClick={() => void validateAndAdvance()}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {step === 'review'
                  ? isTestFlow
                    ? 'Finishing preview…'
                    : 'Creating account…'
                  : step === 'email'
                    ? 'Checking…'
                    : 'Please wait…'}
              </span>
            ) : step === 'welcome' ? (
              <span className="inline-flex items-center gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </span>
            ) : step === 'review' ? (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {isTestFlow ? 'Finish preview' : 'Create account'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        ) : (
          <div className="h-12 shrink-0" aria-hidden />
        )}
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col space-y-5">
      <div className="h-[4.5rem] shrink-0 space-y-1.5 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance leading-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm leading-snug line-clamp-2">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.id)}
            className={cn(
              'w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors touch-manipulation',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
