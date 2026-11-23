import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useRemoveRow } from '@/hooks/useData'
import type { TableName } from '@/lib/types'
import { ConfirmDialog } from './confirm-dialog'
import { EmptyState } from './states'

interface DeleteProps {
  table: TableName
  id: string
  title: string
  description: string
  redirectTo: string
}

/** Trash button + confirmation + redirect, shared by every record page. */
export function DeleteRecordButton({ table, id, title, description, redirectTo }: DeleteProps) {
  const [open, setOpen] = useState(false)
  const remove = useRemoveRow(table)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const confirm = () =>
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(t('common.deleted'))
        navigate(redirectTo)
      },
    })

  return (
    <>
      <Tooltip content={t('common.delete')}>
        <Button variant="ghost" size="icon" className="size-9" onClick={() => setOpen(true)} aria-label={t('common.delete')}><Trash2 /></Button>
      </Tooltip>
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
