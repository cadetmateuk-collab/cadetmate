// app/(protected)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'CadetMate',
    template: '%s | CadetMate',
  },
  description: 'Training platform for maritime cadets',
  keywords: ['maritime training', 'cadet', 'nautical', 'seafarer'],
  openGraph: {
    title: 'CadetMate',
    description: 'Training platform for maritime cadets',
    url: 'https://cadetmate.co.uk',
    siteName: 'CadetMate',
    images: [{ url: '/images/logo.png' }],
  },
}
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return <>{children}</>
}