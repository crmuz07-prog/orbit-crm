import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog } from './confirm-dialog'

export interface ConfirmOptions {
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'default'
  irreversible?: boolean
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

/**
 * One confirmation dialog for the whole app: `if (await confirm({...})) doIt()`.
 * Any step with consequences (sign out, deactivate, grant rights, mark won…) asks through it instead of a local dialog.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(ok: boolean) => void>(() => {})
  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next)
    return new Promise<boolean>((resolve) => { resolver.current = resolve })
  }, [])
  const settle = (ok: boolean) => {
    resolver.current(ok)
    setOptions(null)
  }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog open={!!options} onOpenChange={(o) => !o && settle(false)} title={options?.title ?? ''} description={options?.description ?? ''}
        confirmLabel={options?.confirmLabel} tone={options?.tone} irreversible={options?.irreversible ?? false} onConfirm={() => settle(true)} />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return confirm
}
