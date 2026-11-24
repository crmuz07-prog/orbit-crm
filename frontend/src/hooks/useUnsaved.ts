import { createContext, useContext, useEffect } from 'react'

/** Set by a GuardedDialog: forms inside it report whether they hold unsaved changes. */
export const UnsavedContext = createContext<((dirty: boolean) => void) | null>(null)

/** Warns before the tab is closed or reloaded while something is unsaved (browser's own prompt). */
export function useBeforeUnload(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}

/** A form says it has unsaved changes: the surrounding dialog asks before closing, the browser before leaving. */
export function useReportUnsaved(dirty: boolean) {
  const report = useContext(UnsavedContext)
  useBeforeUnload(dirty)
  useEffect(() => {
    report?.(dirty)
    return () => report?.(false)
  }, [report, dirty])
}
