import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { setUnauthorizedHandler, tokenStore } from '@/lib/http'
import type { Session, Token } from '@/lib/types'

interface AuthState {
  session: Session | null
  loading: boolean
  signIn: (token: Token) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

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
    authApi.me().then(setSession).catch(signOut).finally(() => setLoading(false))
  }, [signOut])

  return <AuthContext.Provider value={{ session, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
