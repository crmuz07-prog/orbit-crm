/**
 * After a deploy, a tab opened on the previous build asks for code chunks that no longer exist.
 * Vite reports it as `vite:preloadError`; one reload picks up the new build. The flag stops reload loops.
 */
const KEY = 'orbit:reloaded-for-build'

export function reloadOnStaleBuild() {
  window.addEventListener('vite:preloadError', (event) => {
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, '1')
    } catch {
      return
    }
    event.preventDefault()
    window.location.reload()
  })
  // A successful start clears the flag, so the next deploy can reload again.
  window.addEventListener('load', () => setTimeout(() => {
    try { sessionStorage.removeItem(KEY) } catch { /* storage unavailable */ }
  }, 10_000))
}
