import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { withRetry } from '@/lib/http'
import type { AuthConfig } from '@/lib/types'

const KEY = 'orbit:auth-config'

function cached(): AuthConfig | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AuthConfig) : undefined
  } catch {
    return undefined
  }
}

async function load(): Promise<AuthConfig> {
  const config = await withRetry(authApi.config)
  try {
    localStorage.setItem(KEY, JSON.stringify(config))
  } catch { /* storage unavailable: the next visit just waits for the API again */ }
  return config
}

/**
 * Sign-in options (demo, sign-up, password reset). The last known answer renders at once, so the login page doesn't
 * change shape while a sleeping free-tier API wakes up; until anything is known, the optional parts stay hidden.
 */
export function useAuthConfig(): AuthConfig | undefined {
  return useQuery({ queryKey: ['auth-config'], queryFn: load, placeholderData: cached, staleTime: 5 * 60_000 }).data
}
