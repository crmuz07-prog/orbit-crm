import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import i18n from 'i18next'
import { Button } from '@/components/ui/button'

/**
 * Last line of defence: a render error shows a way out instead of a blank page.
 * Class component because React has no hook for catching render errors.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Orbit] render error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div role="alert" className="glass max-w-sm rounded-2xl p-6 text-center">
          <TriangleAlert className="mx-auto mb-3 size-6 text-amber-500" />
          <p className="font-semibold">{i18n.t('crash.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{i18n.t('crash.desc')}</p>
          {/* The technical reason, so a report from a user can be traced. */}
          <p className="mt-3 break-words font-mono text-[11px] text-muted-foreground/80">{error.message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}><RotateCcw /> {i18n.t('crash.reload')}</Button>
        </div>
      </div>
    )
  }
}
