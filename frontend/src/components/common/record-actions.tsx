import { useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Trash2, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TABLE_MODULE, useAccess } from '@/hooks/useAccess'
import { useRemoveRow } from '@/hooks/useData'
import { api } from '@/lib/api'
import type { Module, TableName } from '@/lib/types'
import { errorMessage } from '@/lib/utils'
import { ConfirmDialog } from './confirm-dialog'
import { EmptyState } from './states'
import { IconButton } from '@/components/common/icon-button'

interface DeleteProps {
  table: TableName
  id: string
  title: string
  description: string
  redirectTo: string
}

/** Trash button + confirmation + redirect, shared by every record page; hidden without the delete permission. */
export function DeleteRecordButton({ table, id, title, description, redirectTo }: DeleteProps) {
  const [open, setOpen] = useState(false)
  const remove = useRemoveRow(table)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { can } = useAccess()
  if (!can(TABLE_MODULE[table], 'delete')) return null

  const confirm = () =>
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(t('common.deleted'))
        navigate(redirectTo)
      },
    })

  return (
    <>
      <IconButton label={t('common.delete')} className="size-9" onClick={() => setOpen(true)}><Trash2 /></IconButton>
      <ConfirmDialog open={open} onOpenChange={setOpen} title={title} description={description} onConfirm={confirm} />
    </>
  )
}

export function RecordNotFound({ icon, label, backTo }: { icon: LucideIcon; label: string; backTo: string }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={icon}
      title={t('common.notFound', { label })}
      description={t('common.notFoundDesc')}
      action={<Button variant="outline" asChild><Link to={backTo}>{t('common.back')}</Link></Button>}
    />
  )
}

type CreateProps = ComponentProps<typeof Button> & { module: Module }

/** A primary "New …" button that only exists for people allowed to create in `module`. */
export function CreateButton({ module, ...props }: CreateProps) {
  const { can } = useAccess()
  return can(module, 'create') ? <Button {...props} /> : null
}

/** Downloads the list as CSV (exactly the records the user may see); hidden without the export permission. */
export function ExportButton({ table }: { table: TableName }) {
  const { t } = useTranslation()
  const { can } = useAccess()
  const [busy, setBusy] = useState(false)
  if (!can(TABLE_MODULE[table], 'export')) return null
  const run = () => {
    setBusy(true)
    api.exportCsv(table).then(() => toast.success(t('exported')), (e) => toast.error(errorMessage(e))).finally(() => setBusy(false))
  }
  return <IconButton label={t('exportCsv')} variant="outline" className="size-9" disabled={busy} onClick={run}><Download /></IconButton>
}
