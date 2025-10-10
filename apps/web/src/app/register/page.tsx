'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone'),
  password: z.string().min(6, 'Min 6 characters'),
})

type FormData = z.infer<typeof schema>

const API = process.env.NEXT_PUBLIC_API_URL!

export default function RegisterPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const [serverError, setServerError] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.message ?? 'Failed to register')
      }

      // Option A: redirect to login so user can sign in (and do OTP/2FA flows as needed)
      router.push('/login?registered=1')
      // Option B (later): auto-login by calling /auth/login with same creds and storing tokens via AuthContext
    } catch (e: any) {
      setServerError(e.message || 'Something went wrong')
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>

      {serverError && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            {...register('name')}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="Jane Doe"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="jane@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="+2547..."
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-green px-4 py-2 font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-brand-green underline">
            Log in
          </a>
        </p>
      </form>
    </main>
  )
}
