'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { mobileAuthCallbackUrl } from '@/lib/mobile/urls'
import { safeRedirectPath } from '@/lib/security/env'
import { DeveloperGateModal } from '@/components/auth/onboarding/DeveloperGateModal'
import { OnboardingWizard } from '@/components/auth/onboarding/OnboardingWizard'

type Mode = 'login' | 'signup' | 'forgot'

function passwordResetRedirectUrl(): string {
  if (typeof window === 'undefined') return '/reset-password'
  const params = new URLSearchParams(window.location.search)
  if (params.get('source') === 'mobile' || params.get('native') === '1') {
    return mobileAuthCallbackUrl('/reset-password')
  }
  return `${window.location.origin}/reset-password`
}

function AuthFormInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [showDevGate, setShowDevGate] = useState(false)
  const [onboardingActive, setOnboardingActive] = useState(false)
  const [isTestFlow, setIsTestFlow] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup')
      setShowDevGate(true)
      setOnboardingActive(false)
      setIsTestFlow(false)
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      try {
        const { trackConversion, trackEvent } = await import('@/lib/analytics')
        trackConversion('login', { method: 'email', user_id: data.user?.id })
        trackEvent('form_submit', { form_name: 'auth_login', status: 'success' })
      } catch { /* analytics optional */ }
      setMessage({ type: 'success', text: 'Login successful!' })
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!sessionData.session) {
        throw new Error(
          'Signed in but the browser did not store the session. Clear site cookies for localhost:3000 and try again.',
        )
      }
      const target = redirectTo.startsWith('/')
        ? `${window.location.origin}${redirectTo}`
        : `${window.location.origin}/dashboard`
      window.location.href = target
      return
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Sign in failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: passwordResetRedirectUrl(),
      })
      if (error) throw error
      setResetSent(true)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Reset failed' })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: Mode) => {
    setMessage(null)
    setEmail('')
    setPassword('')
    setResetEmail('')
    setResetSent(false)

    if (newMode === 'signup') {
      setMode('signup')
      setShowDevGate(true)
      setOnboardingActive(false)
      setIsTestFlow(false)
      return
    }

    setMode(newMode)
    setShowDevGate(false)
    setOnboardingActive(false)
    setIsTestFlow(false)
    if (newMode === 'login' && searchParams.get('mode') === 'signup') {
      router.replace('/auth')
    }
  }

  const startOnboarding = (asDeveloper: boolean) => {
    setIsTestFlow(asDeveloper)
    setShowDevGate(false)
    setOnboardingActive(true)
  }

  if (mode === 'signup' && onboardingActive) {
    return (
      <OnboardingWizard
        onBackToLogin={() => switchMode('login')}
        isTestFlow={isTestFlow}
      />
    )
  }

  return (
    <div
      className="flex flex-col justify-center space-y-5"
      style={{ width: 'min(26rem, calc(100vw - 2rem))', height: '36rem' }}
    >
      <DeveloperGateModal
        isOpen={showDevGate}
        onContinueAsUser={() => startOnboarding(false)}
        onContinueAsDeveloper={() => startOnboarding(true)}
      />

      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="relative h-16 w-16">
            <Image src="/images/logo.webp" alt="Cadet Mate" fill className="object-contain" priority sizes="64px" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Get Started' : 'Reset Password'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to continue your maritime training'
              : mode === 'signup'
              ? 'Create your account to begin'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>
      </div>

      <Card className="border-2 border-border shadow-xl bg-card overflow-hidden">
        <CardHeader className="py-2">
          <div className="flex items-center justify-center relative">
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="absolute left-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors touch-manipulation"
                aria-label="Back to sign in"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <p className="text-2xl font-semibold text-black tracking-wide">
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Forgot Password'}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pb-8 px-6">
          {mode === 'forgot' && (
            <>
              {resetSent ? (
                <div className="text-center py-6 space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
                  <p className="text-muted-foreground text-sm">
                    We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-sm font-medium text-foreground">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="name@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="pl-11 h-12 bg-background border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {message && (
                    <div role="alert" aria-live="assertive" className="p-4 rounded-lg border-2 bg-red-50 text-red-700 border-red-200">
                      <p className="text-sm font-medium">{message.text}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    style={{ backgroundColor: '#2966f4' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              )}
            </>
          )}

          {mode === 'login' && (
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 bg-background border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="inline-flex items-center min-h-11 text-xs font-medium text-primary hover:underline touch-manipulation px-1"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-11 pr-11 h-12 bg-background border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-primary transition-all touch-manipulation"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  role={message.type === 'error' ? 'alert' : 'status'}
                  aria-live={message.type === 'error' ? 'assertive' : 'polite'}
                  className={`p-4 rounded-lg border-2 transition-all ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                style={{ backgroundColor: '#2966f4' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          )}

          {mode === 'signup' && !onboardingActive && (
            <div className="py-8 text-center space-y-3 text-sm text-muted-foreground">
              <p>Confirm whether you&apos;re signing up as a user or a developer to continue.</p>
              <Button type="button" onClick={() => setShowDevGate(true)}>
                Continue
              </Button>
            </div>
          )}

          {mode !== 'forgot' && (
            <>
              <div className="relative my-6">
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-semibold tracking-wider">or</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full text-center py-3 px-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all group"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              >
                <span className="text-sm font-medium text-foreground">
                  {mode === 'login' ? (
                    <>Don&apos;t have an account?{' '}<span className="text-primary font-semibold group-hover:underline">Sign up for free</span></>
                  ) : (
                    <>Already have an account?{' '}<span className="text-primary font-semibold group-hover:underline">Sign in</span></>
                  )}
                </span>
              </button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Secure authentication powered by</span>
        <div className="relative h-4 w-20">
          <Image src="/images/supabase-logo-wordmark--light.svg" alt="Supabase" fill className="object-contain" />
        </div>
      </div>
    </div>
  )
}

export function AuthForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse rounded-xl bg-muted" />}>
      <AuthFormInner />
    </Suspense>
  )
}
