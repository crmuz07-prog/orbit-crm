import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { authApi } from '@/lib/api'
import { ApiError, setUnauthorizedHandler, tokenStore, withRetry } from '@/lib/http'
import { clearOfflineCache, persistQueries, restoreQueries, sessionCache } from '@/lib/offline-cache'
import type { Session, Token, User } from '@/lib/types'

interface AuthState {
  session: Session | null
  loading: boolean
  /** True while the API is not answering yet (cold start); the UI explains the wait. */
  waking: boolean
  signIn: (token: Token) => void
  /** Signs into another workspace: the cached data of the previous one is dropped. */
  switchTo: (token: Token) => void
  updateUser: (user: User) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  // A returning user starts from the last known session and data (checked against the API right after).
  const [session, setSession] = useState<Session | null>(() => {
    const cached = tokenStore.get() ? sessionCache.read() : null
    if (cached) restoreQueries(qc, cached)
    return cached
  })
  const [loading, setLoading] = useState(() => !!tokenStore.get() && !session)
  const [waking, setWaking] = useState(false)

  const signOut = useCallback(() => {
    tokenStore.clear()
    clearOfflineCache()
    setSession(null)
    qc.clear()
  }, [qc])

  const signIn = useCallback(({ access_token, ...next }: Token) => {
    tokenStore.set(access_token)
    setSession(next)
  }, [])

  const switchTo = useCallback((token: Token) => {
    clearOfflineCache()
    qc.clear()
    signIn(token)
  }, [qc, signIn])

  const updateUser = useCallback((user: User) => setSession((s) => (s ? { ...s, user } : s)), [])

  useEffect(() => {
    // The server ended the session (signed out elsewhere, deactivated, expired): say why instead of a silent jump.
    setUnauthorizedHandler((code) => {
      if (tokenStore.get()) toast.error(i18n.exists(`errors.${code}`) ? i18n.t(`errors.${code}` as 'errors.session_revoked') : i18n.t('errors.signedOut'))
      signOut()
    })
    if (!tokenStore.get()) return
    // Only an explicit 401 ends the session; network errors / 5xx mean the server is still waking up.
    withRetry(authApi.me, () => setWaking(true))
      .then(setSession)
      .catch((e) => e instanceof ApiError && e.status === 401 && signOut())
      .finally(() => {
        setLoading(false)
        setWaking(false)
      })
  }, [signOut])

  // Keep the session and this user's data for the next visit.
  useEffect(() => {
    if (!session) return
    sessionCache.write(session)
    return persistQueries(qc, session)
  }, [qc, session])

  // Admins change roles and deactivate people at any time: pick that up when the tab regains focus.
  useEffect(() => {
    if (!session) return
    const refresh = () => document.visibilityState === 'visible' && authApi.me().then(setSession).catch(() => {})
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [session])

  return <AuthContext.Provider value={{ session, loading, waking, signIn, switchTo, updateUser, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export type WorkspaceSession = Session & { workspace: NonNullable<Session['workspace']>; role: NonNullable<Session['role']> }

/** For screens inside a company: App only renders them when the session has a workspace. */
export function useWorkspaceSession(): WorkspaceSession {
  const { session } = useAuth()
  if (!session?.workspace || !session.role) throw new Error('useWorkspaceSession needs a session with a workspace')
  return session as WorkspaceSession
}
