import { useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { useFormErrors } from '@/hooks/useFormErrors'
import { rules } from '@/lib/validation'
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

  const errors = useFormErrors<'amount' | 'months' | 'seats'>('payment-form')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const valid = errors.validate({ amount, months, seats }, {
      amount: [rules.required(), rules.range(1)], months: [rules.required(), rules.range(1, 120)], seats: [rules.range(1)],
    })
    if (!valid) return
    const draft = { amount: Number(amount), months: term, seats: seats ? Number(seats) : undefined, note: note.trim() || undefined }
    record.mutate({ id: company.id, draft }, { onSuccess: () => { setAmount(''); setNote('') }, onError: (err) => errors.fromApi(err) })
  }

  return (
    <form id="payment-form" onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <TextField name="amount" label={t('billing.amount')} type="number" min={1} value={amount} onChange={errors.bind('amount', setAmount)} error={errors.message('amount')} />
      <TextField name="months" label={t('billing.months')} type="number" min={1} max={120} value={months} onChange={errors.bind('months', setMonths)} error={errors.message('months')} />
      <TextField name="seats" label={t('billing.seatsField')} type="number" min={1} value={seats} onChange={errors.bind('seats', setSeats)} error={errors.message('seats')} placeholder={company.seat_limit ? String(company.seat_limit) : ''} />
      <TextField label={t('billing.note')} value={note} onChange={setNote} maxLength={500} />
      <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">{t('billing.newEnd', { date: shortDate(newEnd) })}</p>
        <Button type="submit" disabled={record.isPending}><Wallet /> {t('billing.recordPayment')}</Button>
      </div>
    </form>
  )
}
