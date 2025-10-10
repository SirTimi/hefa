'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { loginPassword, loginOtp, sendOtp } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const contact = email || phone

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (tab === 'password') {
        await loginPassword({
          email: email || undefined,
          phone: phone || undefined,
          password,
        })
      } else {
        await loginOtp({
          email: email || undefined,
          phone: phone || undefined,
          otp,
        })
      }
      router.push('/')
    } catch (err: any) {
      alert(err?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function onSendOtp() {
    if (!contact) return alert('Enter email or phone')
    setBusy(true)
    try {
      await sendOtp({ email: email || undefined, phone: phone || undefined })
      alert('OTP sent')
    } catch (e: any) {
      alert(e?.message || 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <div className="mt-6 grid grid-cols-2 rounded-full border p-1 text-sm">
        <button
          onClick={() => setTab('password')}
          className={`rounded-full px-4 py-2 ${tab === 'password' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
        >
          Password
        </button>
        <button
          onClick={() => setTab('otp')}
          className={`rounded-full px-4 py-2 ${tab === 'otp' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
        >
          OTP
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          placeholder="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border px-4 py-3"
        />
        <input
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border px-4 py-3"
        />

        {tab === 'password' ? (
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
            required
          />
        ) : (
          <div className="flex items-center gap-2">
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="flex-1 rounded-xl border px-4 py-3"
              required
            />
            <button
              type="button"
              onClick={onSendOtp}
              className="rounded-xl border px-4 py-3 hover:bg-gray-50"
              disabled={busy || !contact}
            >
              Send OTP
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? 'Please wait…' : 'Continue'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Don’t have an account?{' '}
        <Link href="/register" className="text-brand-green">
          Create one
        </Link>
      </p>
    </div>
  )
}
