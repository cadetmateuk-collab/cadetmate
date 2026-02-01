import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    profile,
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }
  
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  
  if (!user.profile || !allowedRoles.includes(user.profile.role)) {
    redirect('/unauthorized')
  }
  
  return user
}