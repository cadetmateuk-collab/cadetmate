import { CadetMateSidebar } from '@/components/Sidebar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <CadetMateSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-none pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}