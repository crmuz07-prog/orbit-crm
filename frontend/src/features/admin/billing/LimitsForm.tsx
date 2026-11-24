import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import type { PlatformCompany } from '@/lib/types'
import type { AdminActions } from '../useAdmin'

/** Seat limit and end date set by hand (e.g. a trial or a correction); empty means unlimited. */
export function LimitsForm({ company, update }: { company: PlatformCompany; update: AdminActions['updateCompany'] }) {
  const { t } = useTranslation()
  const [seats, setSeats] = useState(company.seat_limit?.toString() ?? '')
  const [endsAt, setEndsAt] = useState(company.subscription_ends_at ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    update.mutate({ id: company.id, patch: { seat_limit: seats ? Number(seats) : null, subscription_ends_at: endsAt || null } })
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <TextField label={t('billing.seatLimit')} type="number" min={1} value={seats} onChange={setSeats} placeholder={t('billing.unlimited')} />
      <TextField label={t('billing.endDate')} type="date" value={endsAt} onChange={setEndsAt} />
      <div className="flex items-center justify-between gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">{t('billing.emptyHint')}</p>
        <Button type="submit" variant="outline" disabled={update.isPending}>{t('common.save')}</Button>
      </div>
    </form>
  )
}
