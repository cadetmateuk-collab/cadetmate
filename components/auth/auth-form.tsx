'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        setMessage({ type: 'success', text: 'Login successful!' })
        router.push('/settings')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        
        if (error) throw error
        
        setMessage({ type: 'success', text: 'Check your email to confirm your account!' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address first' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Password reset link sent to your email!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <h1 className="text-3xl font-bold text-foreground">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? 'Sign in to continue your maritime training' 
              : 'Create your account to begin'}
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <Card className="border-2 border-border shadow-xl bg-card overflow-hidden">
        <CardHeader className="py-2">
          <div className="flex items-center justify-center">
            <p className="text-2xl font-semibold text-black tracking-wide">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="pb-8 px-6">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="pl-11 h-12 bg-background border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}
            
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
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
                  Minimum 6 characters required
                </p>
              )}
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
                  <span>Processing...</span>
                </span>
              ) : (
                <span>{isLogin ? 'Login' : 'Create Account'}</span>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-semibold tracking-wider">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full text-center py-3 px-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all group"
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage(null)
              setFullName('')
              setEmail('')
              setPassword('')
            }}
          >
            <span className="text-sm font-medium text-foreground">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-primary font-semibold group-hover:underline">
                    Sign up for free
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-primary font-semibold group-hover:underline">
                    Sign in
                  </span>
                </>
              )}
            </span>
          </button>
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
  )
}