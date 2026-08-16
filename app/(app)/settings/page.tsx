import { requireAuth } from '@/lib/auth/get-user'
import { isPremiumRole } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Crown, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Shield,
  Sparkles,
  CheckCircle2,
  XCircle,
  KeyRound
} from 'lucide-react'
import { PasswordResetButton } from './PasswordResetButton'
import { SubscribeButton } from '@/components/billing/SubscribeButton'
import { BillingPortalButton } from '@/components/billing/BillingPortalButton'
import { getPremiumPrice } from '@/lib/stripe/premium-price'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: stats } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: recentModules } = await supabase
    .from('user_module_progress')
    .select('module_id, modules(title), last_accessed, progress')
    .eq('user_id', user.id)
    .order('last_accessed', { ascending: false })
    .limit(5)

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth')
  }

  async function sendPasswordReset() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const headerStore = await headers()
    const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
    const proto = headerStore.get('x-forwarded-proto') ?? 'http'
    const origin = host ? `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}` : undefined
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: origin ? `${origin}/reset-password` : undefined,
    })
  }

  const isPremium = isPremiumRole(user.profile?.role)
  const isAdmin = user.profile?.role === 'admin'
  const premiumPrice = await getPremiumPrice()

  const totalHours = Math.floor((stats?.total_time_seconds || 0) / 3600)
  const totalMinutes = Math.floor(((stats?.total_time_seconds || 0) % 3600) / 60)
  const modulesStarted = stats?.modules_started || 0
  const modulesCompleted = stats?.modules_completed || 0
  const currentStreak = stats?.daily_streak || 0

  return (
    <div className="py-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user.profile?.full_name?.split(' ')[0] || 'Cadet'}! 👋
            </h1>
            <p className="text-gray-600">Here's your maritime training overview</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" size="lg">Sign Out</Button>
          </form>
        </div>

        {/* Subscription Status Banner */}
        {!isPremium && (
          <Card className="mb-8 border border-border bg-background">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Unlock Your Full Potential
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upgrade to Premium to access all training modules, TRB tools, and expert guidance
                    </p>
                    <div className="flex gap-3">
                      <SubscribeButton
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        label={
                          premiumPrice
                            ? `Upgrade to Premium · ${premiumPrice.formatted}`
                            : 'Upgrade to Premium'
                        }
                      />
                      <Button variant="outline" asChild>
                        <Link href="/pricing">View Benefits</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time on Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalHours}h {totalMinutes}m</div>
              <p className="text-xs text-gray-500 mt-1">Total learning time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Modules Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{modulesStarted}</div>
              <p className="text-xs text-gray-500 mt-1">{modulesCompleted} completed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{currentStreak}</div>
              <p className="text-xs text-gray-500 mt-1">Days in a row</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {modulesStarted > 0 ? Math.round((modulesCompleted / modulesStarted) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall progress</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.profile?.full_name || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Account details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <Badge
                    variant={isPremium ? 'default' : 'secondary'}
                    className={isPremium ? 'bg-blue-600' : ''}
                  >
                    {isAdmin ? (
                      <><Shield className="h-3 w-3 mr-1" /> Admin</>
                    ) : isPremium ? (
                      <><Crown className="h-3 w-3 mr-1" /> Premium</>
                    ) : (
                      'Free'
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.last_sign_in_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Password Reset */}
              <div className="pt-3 border-t border-border">
  <PasswordResetButton action={sendPasswordReset} />
</div>

            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest module progress</CardDescription>
            </CardHeader>
            <CardContent>
              {recentModules && recentModules.length > 0 ? (
                <div className="space-y-3">
                  {recentModules.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.modules?.title || 'Module'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last accessed: {new Date(item.last_accessed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${item.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {item.progress || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start a module to see your progress here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Management */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent>
            {isPremium ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {isAdmin ? 'Admin Account' : 'Premium Subscription Active'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {isAdmin
                          ? 'You have full access to all features and admin tools'
                          : 'You have access to all premium features and content'}
                      </p>
                    </div>
                  </div>
                </div>
                {!isAdmin && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <BillingPortalButton className="flex-1">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Update Payment Method
                    </BillingPortalButton>
                    <BillingPortalButton className="flex-1">
                      View Billing History
                    </BillingPortalButton>
                    <BillingPortalButton className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Subscription
                    </BillingPortalButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Free Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upgrade to Premium to unlock all features and accelerate your maritime training
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>All training modules</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>TRB management tools</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Sea survival resources</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Expert tips & guidance</span>
                    </div>
                  </div>
                  <SubscribeButton
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    label={
                      premiumPrice
                        ? `Upgrade to Premium · ${premiumPrice.formattedWithInterval}`
                        : 'Upgrade to Premium'
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

    </div>
  )
}