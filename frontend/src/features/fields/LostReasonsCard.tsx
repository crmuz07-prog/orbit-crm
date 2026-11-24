import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCreateRow, useRemoveRow, useRows } from '@/hooks/useData'

/** Settings: the fixed list of loss reasons the lost dialog offers (Pipedrive "lost reasons"). */
export function LostReasonsCard() {
  const { t } = useTranslation()
  const { data } = useRows('lost_reasons')
  const reasons = [...(data ?? [])].sort((a, b) => a.position - b.position)
  const create = useCreateRow('lost_reasons')
  const remove = useRemoveRow('lost_reasons')
  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const add = () => {
    const value = name.trim()
    if (!value || reasons.some((r) => r.name.toLowerCase() === value.toLowerCase())) return
    create.mutate({ name: value, position: reasons.length }, { onSuccess: () => { setName(''); toast.success(t('lostReasons.saved')) } })
  }

  return (
    <Card>
      <CardHeader title={t('lostReasons.title')} description={t('lostReasons.description')} />
      <CardContent className="space-y-2.5">
        {reasons.length === 0 ? <p className="text-xs text-muted-foreground">{t('lostReasons.empty')}</p> : (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 py-0.5 pl-2 pr-1 text-xs text-rose-700 dark:text-rose-300">
                {r.name}
                <button type="button" aria-label={t('common.delete')} className="rounded p-0.5 hover:bg-rose-500/15"
                  onClick={() => setDeleting(r)}><X className="size-3" /></button>
              </span>
            ))}
          </div>
        )}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('lostReasons.placeholder')} maxLength={120} className="h-8" />
          <Button size="sm" type="submit" variant="outline" disabled={!name.trim()}><Plus /> {t('lostReasons.add')}</Button>
        </form>
      </CardContent>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={t('lostReasons.deleteTitle')} description={deleting?.name ?? ''}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast.success(t('lostReasons.deleted')); setDeleting(null) } })} />
    </Card>
  )
}
