import { useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { addMonths, nextPeriodStart } from '@/lib/billing'
import type { PlatformCompany } from '@/lib/types'
import { shortDate } from '@/lib/utils'
import type { AdminActions } from '../useAdmin'

/** Records a payment; previews the new end date with the same stacking rule as the API. */
export function PaymentForm({ company, record }: { company: PlatformCompany; record: AdminActions['recordPayment'] }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [months, setMonths] = useState(String(company.license_months))
  const [seats, setSeats] = useState('')
  const [note, setNote] = useState('')
  const term = Math.max(1, Number(months) || 1)
  const newEnd = addMonths(nextPeriodStart(company.subscription_ends_at), term)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const draft = { amount: Number(amount), months: term, seats: seats ? Number(seats) : undefined, note: note.trim() || undefined }
    record.mutate({ id: company.id, draft }, { onSuccess: () => { setAmount(''); setNote('') } })
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <TextField label={t('billing.amount')} type="number" min={1} required value={amount} onChange={setAmount} />
      <TextField label={t('billing.months')} type="number" min={1} max={120} required value={months} onChange={setMonths} />
      <TextField label={t('billing.seatsField')} type="number" min={1} value={seats} onChange={setSeats} placeholder={company.seat_limit ? String(company.seat_limit) : ''} />
      <TextField label={t('billing.note')} value={note} onChange={setNote} maxLength={500} />
      <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">{t('billing.newEnd', { date: shortDate(newEnd) })}</p>
        <Button type="submit" disabled={record.isPending || !Number(amount)}><Wallet /> {t('billing.recordPayment')}</Button>
      </div>
    </form>
  )
}
