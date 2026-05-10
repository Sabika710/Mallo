export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string | null
}

export async function apiFetch<T = unknown>(
  path: string,
  { body, token, ...init }: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    
    // Debug: log org_id from every outgoing token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('[apiFetch]', path, '| org_id:', payload.org_id ?? 'MISSING')
    } catch {}
  }

  const url = `${BASE}/${path.replace(/^\//, '')}`

  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const json = await res.json()
      message = json?.message ?? message
    } catch {}
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}