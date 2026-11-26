import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Database, Download, FileUp, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { ImportDialog } from '@/features/import/ImportDialog'
import { useCrm } from '@/hooks/useData'
import { api } from '@/lib/api'
import type { TableName } from '@/lib/types'
import { errorMessage } from '@/lib/utils'
import { useConfirm } from '@/components/common/confirm-provider'

const EXPORTS = ['deals', 'contacts', 'companies'] as const satisfies readonly TableName[]

function DataAction({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.06] px-4 py-3 first-of-type:border-t-0">
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
  const [importing, setImporting] = useState(false)
  const { deals, contacts, companies } = useCrm()
  const empty = deals.length + contacts.length + companies.length === 0
  const { t } = useTranslation()
  const confirm = useConfirm()
  const addSample = async () => {
    if (await confirm({ title: t('confirm.sample.title'), description: t('confirm.sample.desc'), confirmLabel: t('confirm.sample.action'), tone: 'default' })) run(api.seed, t('settings.sampleDone'))
  }

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
      <DataAction title={t('setup.data.importTitle')} description={t('setup.data.importDesc')}>
        <Button variant="outline" onClick={() => setImporting(true)}><FileUp /> {t('setup.data.importTitle')}</Button>
      </DataAction>
      <DataAction title={t('setup.data.exportTitle')} description={t('setup.data.exportDesc')}>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((table) => (
            <Button key={table} variant="outline" size="sm" disabled={busy} onClick={() => run(() => api.exportCsv(table), t('exported'))}>
              <Download /> {t(`nav.${table}`)}
            </Button>
          ))}
        </div>
      </DataAction>
      {/* Sample records only into an empty workspace: in a real client's CRM they would mix with real data. */}
      {!session?.workspace?.is_demo && empty && (
        <DataAction title={t('settings.sampleTitle')} description={`${t('settings.sampleDesc')} ${t('setup.data.sampleHint')}`}>
          <Button variant="outline" disabled={busy} onClick={addSample}><Database /> {t('settings.sampleTitle')}</Button>
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
      <ImportDialog open={importing} onOpenChange={setImporting} />
    </Card>
  )
}
