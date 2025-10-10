import { getAccess, getRefresh, saveTokens, clearTokens } from './storage'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type Opts = {
  method?: string
  headers?: Record<string, string>
  body?: any
  noAuth?: boolean
}

async function raw(path: string, opts: Opts = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  const token = getAccess()
  if (!opts.noAuth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'omit',
  })
  return res
}

async function refreshTokens(): Promise<boolean> {
  const r = getRefresh()
  if (!r) return false
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: r }),
  })
  if (!res.ok) return false
  const data = await res.json()
  // expect { accessToken, refreshToken? }
  saveTokens(data.accessToken, data.refreshToken)
  return true
}

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  let res = await raw(path, opts)
  if (res.status === 401 && !opts.noAuth) {
    const ok = await refreshTokens()
    if (ok) res = await raw(path, opts) // retry once
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json')
    ? await res.json()
    : ((await res.text()) as any)
}
