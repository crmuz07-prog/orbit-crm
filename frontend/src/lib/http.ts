const TOKEN_KEY = 'orbit:token'

/** API origin; empty in local dev (Vite proxies /api), the Render URL in production builds. */
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const API_BASE = `${API_ORIGIN}/api`

/** Public URL of an API path — what an external PBX must call. */
export const publicApiUrl = (path: string) => `${API_ORIGIN || window.location.origin}${path}`

export const tokenStore = {
  get: () => safe(() => localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => safe(() => localStorage.setItem(TOKEN_KEY, token)),
  clear: () => safe(() => localStorage.removeItem(TOKEN_KEY)),
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

/** FastAPI returns `detail` as a string, or a list of validation issues for 422. */
function readDetail(body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg).join(', ')
  return 'Request failed'
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn)

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const token = tokenStore.get()
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.status === 401) onUnauthorized()
  return response
}

async function fail(response: Response): Promise<never> {
  const data: unknown = await response.json().catch(() => null)
  throw new ApiError(response.status, readDetail(data), (data as { code?: string } | null)?.code)
}

export async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(method, path, body)
  if (!response.ok) return fail(response)
  if (response.status === 204) return undefined as T
  return (await response.json().catch(() => null)) as T
}

/** Authenticated file download (a plain link can't carry the bearer token). */
export async function download(path: string, filename: string): Promise<void> {
  const response = await send('GET', path)
  if (!response.ok) return fail(response)
  const url = URL.createObjectURL(await response.blob())
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  link.click()
  URL.revokeObjectURL(url)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Retries a request while the server is unreachable or failing (5xx), e.g. a free-tier instance waking up.
 * Client errors (4xx such as 401) are final and rethrown immediately.
 */
export async function withRetry<T>(request: () => Promise<T>, onRetry?: () => void, delays = [2000, 3000, 5000, 8000, 10000, 15000, 15000]): Promise<T> {
  for (const delay of delays) {
    try {
      return await request()
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) throw error
      onRetry?.()
      await sleep(delay)
    }
  }
  return request()
}
