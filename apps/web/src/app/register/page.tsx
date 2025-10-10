// apps/web/src/app/register/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api, setTokens } from '@/lib/api'

type RegisterResponse = { accessToken: string; refreshToken?: string }

export default function RegisterPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const form = new FormData(e.currentTarget)
      const values = Object.fromEntries(form) as {
        name: string
        email: string
        password: string
      }

      // If you have a /auth/register endpoint, use it.
      const res = await api<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: values,
      })

      setTokens(res.accessToken, res.refreshToken)
      window.location.href = '/'
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to register. Please try again.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          name="name"
          type="text"
          required
          placeholder="Full name"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link className="underline" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  )
}
