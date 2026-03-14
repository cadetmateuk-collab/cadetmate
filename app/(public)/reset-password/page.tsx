'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/auth'), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative h-20 w-20">
              <Image
                src="/images/logo.png"
                alt="Cadet Mate"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>
        </div>

        <Card className="border-2 border-border shadow-xl bg-card overflow-hidden">
          <CardHeader className="py-2">
            <div className="flex items-center justify-center">
              <p className="text-2xl font-semibold text-black tracking-wide">
                New Password
              </p>
            </div>
          </CardHeader>

          <CardContent className="pb-8 px-6">
            {done ? (
              <div className="text-center py-6 space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Password Updated!</h2>
                <p className="text-muted-foreground text-sm">
                  Your password has been changed successfully. Redirecting you to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-11 pr-11 h-12 bg-background border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
                    Minimum 6 characters required
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-11 pr-11 h-12 bg-background border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    message.type === 'error'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {message.type === 'success' ? (
                        <svg className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <p className="text-sm font-medium">{message.text}</p>
                    </div>
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
                      <span>Updating...</span>
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Secure authentication powered by</span>
          <div className="relative h-4 w-20">
            <Image
              src="/images/supabase-logo-wordmark--light.svg"
              alt="Supabase"
              fill
              className="object-contain"
            />
          </div>
        </div>

      </div>
    </div>
  )
}