const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

type Opts = RequestInit & { auth?: string }

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(opts.auth ? { Authorization: `Bearer ${opts.auth}` } : {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim())
  }
  return res.json() as Promise<T>
}
