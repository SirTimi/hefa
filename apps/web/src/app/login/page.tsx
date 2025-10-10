// apps/web/src/app/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api, setTokens } from '@/lib/api'

type LoginResponse = { accessToken: string; refreshToken?: string }

export default function LoginPage() {
  const [method, setMethod] = useState<'password' | 'otp'>('password')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      const form = new FormData(e.currentTarget)
      const values = Object.fromEntries(form) as {
        email: string
        password?: string
        code?: string
      }

      const payload =
        method === 'password'
          ? { email: values.email, password: values.password }
          : { email: values.email, code: values.code }

      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { ...payload, method },
      })

      setTokens(res.accessToken, res.refreshToken)
      window.location.href = '/'
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to login. Please try again.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            className={`px-3 py-1 rounded ${method === 'password' ? 'bg-black text-white' : 'bg-gray-200'}`}
            onClick={() => setMethod('password')}
          >
            Password
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded ${method === 'otp' ? 'bg-black text-white' : 'bg-gray-200'}`}
            onClick={() => setMethod('otp')}
          >
            One-time code
          </button>
        </div>

        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
        />

        {method === 'password' ? (
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded border px-3 py-2"
          />
        ) : (
          <input
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="6-digit code"
            className="w-full rounded border px-3 py-2"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-sm text-gray-600">
          No account?{' '}
          <Link className="underline" href="/register">
            Create one
          </Link>
        </p>
      </form>
    </main>
  )
}
