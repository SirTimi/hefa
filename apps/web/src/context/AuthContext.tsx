'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { saveTokens, clearTokens, getAccess } from '@/lib/storage'

/** Shape of the authenticated user object returned by /auth/me */
export type User = {
  id: string
  email?: string
  name?: string
  roles?: string[]
}

/** Public surface area of our auth context */
export type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (p: {
    email: string
    password?: string
    otp?: string
  }) => Promise<void>
  register: (p: {
    name: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, if we have a token, fetch /auth/me to hydrate the session
  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const token = getAccess()
        if (!token) return
        const me = await api<User>('/auth/me')
        if (!cancelled) setUser(me)
      } catch {
        // ignore; user stays logged out
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login: AuthContextValue['login'] = async ({ email, password, otp }) => {
    // Supports password OR OTP flows; backend decides based on payload
    const res = await api<{
      accessToken: string
      refreshToken: string
    }>('/auth/login', {
      method: 'POST',
      body: { email, password, otp },
    })
    saveTokens(res.accessToken, res.refreshToken)
    const me = await api<User>('/auth/me')
    setUser(me)
    setLoading(false)
  }

  const register: AuthContextValue['register'] = async ({
    name,
    email,
    password,
  }) => {
    // If your backend uses /auth/register (as we built), call it first
    try {
      await api('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      })
    } catch {
      // If register endpoint is disabled in some env, we swallow so UI won't crash
    }
    // then log the user in
    await login({ email, password })
  }

  const logout = () => {
    try {
      void api('/auth/logout', { method: 'POST' })
    } catch {
      // ignore network errors on logout
    }
    clearTokens()
    setUser(null)
  }

  const value: AuthContextValue = { user, loading, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Safe hook: returns a no-op default if used outside of provider during SSR/prerender.
 * This prevents build-time 404 prerender or static export from crashing.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      user: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
    }
  }
  return ctx
}
