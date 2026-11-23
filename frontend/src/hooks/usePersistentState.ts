import { useEffect, useState } from 'react'

/** useState that survives reloads (per browser); falls back silently when storage is blocked. */
export function usePersistentState<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key) as T | null
      return stored && allowed.includes(stored) ? stored : fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }, [key, value])

  return [value, setValue] as const
}
