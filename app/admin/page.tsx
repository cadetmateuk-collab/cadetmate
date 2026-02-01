import { requireRole } from '@/lib/auth/get-user'

export default async function AdminPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
      <p>Welcome, {user.profile?.full_name}! This page is only accessible to admins.</p>
    </div>
  )
}