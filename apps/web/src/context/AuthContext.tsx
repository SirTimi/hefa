'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { saveTokens, clearTokens, getAccess } from '@/lib/storage'

type User = {
  id: string
  email?: string
  phone?: string
  roles: string[]
  name?: string
}

type AuthState = {
  user: User | null
  loading: boolean
  loginPassword: (p: {
    email?: string
    phone?: string
    password: string
  }) => Promise<void>
  loginOtp: (p: {
    email?: string
    phone?: string
    otp: string
  }) => Promise<void>
  sendOtp: (p: { email?: string; phone?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshMe() {
    try {
      if (!getAccess()) {
        setUser(null)
        return
      }
      const me = await api<User>('/auth/me')
      setUser(me)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    // load session on mount
    ;(async () => {
      setLoading(true)
      await refreshMe()
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loginPassword(p: {
    email?: string
    phone?: string
    password: string
  }) {
    const data = await api<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: { ...p, mode: 'password' },
        noAuth: true,
      },
    )
    saveTokens(data.accessToken, data.refreshToken)
    await refreshMe()
    qc.invalidateQueries() // refetch lists that depend on auth
  }

  async function sendOtp(p: { email?: string; phone?: string }) {
    await api('/auth/otp/send', { method: 'POST', body: p, noAuth: true })
  }

  async function loginOtp(p: { email?: string; phone?: string; otp: string }) {
    const data = await api<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: { ...p, mode: 'otp' },
        noAuth: true,
      },
    )
    saveTokens(data.accessToken, data.refreshToken)
    await refreshMe()
    qc.invalidateQueries()
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {}
    clearTokens()
    setUser(null)
    qc.clear()
  }

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        loginPassword,
        loginOtp,
        sendOtp,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
