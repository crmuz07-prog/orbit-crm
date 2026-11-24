import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Database, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

function DataAction({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.06] px-5 py-4 first-of-type:border-t-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function DataCard() {
  const { session } = useAuth()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const { t } = useTranslation()

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true)
    try {
      await action()
      await qc.invalidateQueries()
      toast.success(success)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader title={t('settings.data')} />
      {/* The demo is read-only and has its own reset; real workspaces can load sample data. */}
      {!session?.workspace?.is_demo && (
        <DataAction title={t('settings.sampleTitle')} description={t('settings.sampleDesc')}>
          <Button variant="outline" disabled={busy} onClick={() => run(api.seed, t('settings.sampleDone'))}><Database /> {t('settings.sampleTitle')}</Button>
        </DataAction>
      )}
      {session?.workspace?.is_demo && (
        <DataAction title={t('settings.resetTitle')} description={t('settings.resetDesc')}>
          <Button variant="destructive" disabled={busy} onClick={() => setConfirmReset(true)}><RotateCcw /> {t('common.reset')}</Button>
        </DataAction>
      )}
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('settings.resetConfirm')}
        description={t('settings.resetConfirmDesc')}
        confirmLabel={t('common.reset')}
        onConfirm={() => run(api.reset, t('settings.resetDone'))}
      />
    </Card>
  )
}
