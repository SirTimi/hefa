// apps/web/src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}
export function setTokens(access: string, refresh?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access)
    if (refresh) localStorage.setItem('refreshToken', refresh)
  }
}
export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export interface ApiOptions {
  method?: HttpMethod
  body?: unknown // caller provides shape; we serialize
  headers?: Record<string, string>
  auth?: boolean // add Authorization header
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
  }

  if (opts.auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
    cache: 'no-store',
  })

  if (res.status === 401) {
    clearTokens()
  }

  if (!res.ok) {
    let detail: unknown
    try {
      detail = await res.json()
    } catch {
      /* ignore */
    }
    throw new Error(`API ${res.status}: ${JSON.stringify(detail ?? {})}`)
  }

  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}
