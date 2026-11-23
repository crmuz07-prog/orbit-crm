import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { ApiError, setUnauthorizedHandler, tokenStore, withRetry } from '@/lib/http'
import type { Session, Token } from '@/lib/types'

interface AuthState {
  session: Session | null
  loading: boolean
  /** True while the API is not answering yet (cold start); the UI explains the wait. */
  waking: boolean
  signIn: (token: Token) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!tokenStore.get())
  const [waking, setWaking] = useState(false)

  const signOut = useCallback(() => {
    tokenStore.clear()
    setSession(null)
    qc.clear()
  }, [qc])

  const signIn = useCallback(({ access_token, user, workspace }: Token) => {
    tokenStore.set(access_token)
    setSession({ user, workspace })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
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

  return <AuthContext.Provider value={{ session, loading, waking, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
