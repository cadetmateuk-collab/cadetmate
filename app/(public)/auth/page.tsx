import { AuthForm } from '@/components/auth/auth-form'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const user = await getCurrentUser()
  const { redirectTo } = await searchParams

  if (user) {
    const target = redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard'
    redirect(target)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthForm />
    </div>
  )
}