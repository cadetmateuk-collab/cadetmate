import { CadetMateSidebar } from "@/components/Sidebar"
import ActivityTracker from '@/components/ActivityTracker'
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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Tracks page loads, clicks, and tab focus — writes last_seen_at via /api/ping */}
      <ActivityTracker />

      {/* Sidebar */}
      <CadetMateSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 pt-16 lg:pt-0">
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}