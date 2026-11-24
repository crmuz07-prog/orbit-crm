import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/utils'

/** Busy flag + error toast around async actions — shared by every auth form. */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false)

  /** Resolves to true on success; failures are shown as a toast. */
  const attempt = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true)
    try {
      await action()
      return true
    } catch (e) {
      toast.error(errorMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  /** Like `attempt`, but returns the action's value (undefined on failure). */
  const run = async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    let value: T | undefined
    await attempt(async () => {
      value = await action()
    })
    return value
  }

  return { busy, attempt, run }
}
