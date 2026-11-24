/**
 * Stale-while-revalidate across reloads: the last session and the last loaded query data are kept in localStorage,
 * so a returning user sees the page at once while fresh data loads in the background (and a sleeping free-tier API
 * wakes up). Scoped per user and workspace, versioned, 24 h old at most, and removed on sign-out.
 */
import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'
import type { Session } from './types'

// Bump when the shape of cached API data changes, so an old cache is never rendered by new code.
const VERSION = 1
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const SESSION_KEY = 'orbit:session'
const DATA_PREFIX = 'orbit:cache:'

type Stored<T> = { version: number; savedAt: number; value: T }

function read<T>(key: string): T | null {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null') as Stored<T> | null
    if (!stored || stored.version !== VERSION || Date.now() - stored.savedAt > MAX_AGE_MS) return null
    return stored.value
  } catch {
    return null
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ version: VERSION, savedAt: Date.now(), value } satisfies Stored<T>))
  } catch {
    /* full or blocked storage: the app simply loads from the API as before */
  }
}

const dataKey = (session: Session) => `${DATA_PREFIX}${session.user.id}:${session.workspace?.id ?? 'platform'}`

export const sessionCache = {
  read: () => read<Session>(SESSION_KEY),
  write: (session: Session) => write(SESSION_KEY, session),
}

export function restoreQueries(client: QueryClient, session: Session) {
  const state = read<unknown>(dataKey(session))
  if (state) hydrate(client, state)
}

/** Saves successful queries (debounced) for this user and workspace; returns the unsubscribe function. */
export function persistQueries(client: QueryClient, session: Session): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = () => write(dataKey(session), dehydrate(client, { shouldDehydrateQuery: (q) => q.state.status === 'success' }))
  const unsubscribe = client.getQueryCache().subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(save, 1000)
  })
  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}

/** Removes every stored session and dataset (sign-out, or a shared computer). */
export function clearOfflineCache() {
  try {
    Object.keys(localStorage).filter((k) => k === SESSION_KEY || k.startsWith(DATA_PREFIX)).forEach((k) => localStorage.removeItem(k))
  } catch {
    /* storage unavailable */
  }
}
