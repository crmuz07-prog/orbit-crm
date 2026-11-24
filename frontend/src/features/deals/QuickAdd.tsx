import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateRow } from '@/hooks/useData'
import type { Stage } from '@/lib/types'

/** amoCRM "Быстрое добавление": a deal straight into the first stage with just a name and an amount. */
export function QuickAdd({ stage }: { stage: Stage }) {
  const { t } = useTranslation()
  const create = useCreateRow('deals')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate({ title: title.trim(), amount: Number(amount) || 0, stage_id: stage.id }, {
      onSuccess: () => { toast.success(t('common.created', { entity: t('entity.deal') })); setTitle(''); setAmount(''); setOpen(false) },
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/15 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
        <Plus className="size-3.5" /> {t('board.quickAdd')}
      </button>
    )
  }
  return (
    <form onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} className="space-y-2 rounded-lg border border-primary/30 p-2">
      <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('board.quickTitle')} className="h-8" />
      <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('board.quickAmount')} className="h-8" />
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
        <Button type="submit" size="sm" disabled={create.isPending}>{t('common.add')}</Button>
      </div>
    </form>
  )
}
