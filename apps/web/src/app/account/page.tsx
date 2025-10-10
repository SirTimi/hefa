'use client'

import { useAuth } from '@/context/AuthContext'

export default function AccountPage() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Loading…</div>
  if (!user) return <div className="p-6">Please sign in.</div>

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Hello, {user.name || user.email}
      </h1>
      <pre className="mt-4 rounded-lg bg-gray-50 p-4 text-xs">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  )
}
