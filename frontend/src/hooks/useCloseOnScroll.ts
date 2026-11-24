import { useEffect } from 'react'

/**
 * Closes an anchored popup when the page scrolls under it (from erp1): a calendar left floating away from its field
 * is its own kind of broken. Scrolling inside the panel (month list, hour column) never reaches `window`.
 */
export function useCloseOnScroll(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', close, { passive: true })
    return () => window.removeEventListener('scroll', close)
  }, [open, close])
}
