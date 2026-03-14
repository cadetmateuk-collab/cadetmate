import { CadetMateSidebar } from '@/components/Sidebar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <CadetMateSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}