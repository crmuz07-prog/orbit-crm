import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/utils'

/**
 * Busy flag + error toast around async actions — shared by every auth form.
 * `onFieldError` may claim an error for inline display (API field errors); otherwise it is a toast.
 */
export function useAsyncAction(onFieldError?: (error: unknown) => boolean) {
  const [busy, setBusy] = useState(false)

  /** Resolves to true on success; failures are shown as a toast. */
  const attempt = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true)
    try {
      await action()
      return true
    } catch (e) {
      if (!onFieldError?.(e)) toast.error(errorMessage(e))
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
