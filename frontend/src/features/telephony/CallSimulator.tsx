import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneCall, PhoneOff } from 'lucide-react'
import { toast } from 'sonner'
import { SelectField, TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { DirectionPicker } from '@/features/calls/CallPickers'
import { Section } from '@/features/calls/CallNotesFields'
import { useCrm } from '@/hooks/useData'
import { telephonyApi } from '@/lib/api'
import type { CallDirection, ProviderStatus } from '@/lib/types'
import { errorMessage, fullName } from '@/lib/utils'

const STATUSES: { value: ProviderStatus; outcome: 'connected' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' }[] = [
  { value: 'answered', outcome: 'connected' },
  { value: 'no_answer', outcome: 'no_answer' },
  { value: 'busy', outcome: 'busy' },
  { value: 'voicemail', outcome: 'voicemail' },
]

/** Plays the role of a PBX: sends call start / hang-up through the real ingestion pipeline. */
export function CallSimulator() {
  const { t } = useTranslation()
  const { contacts } = useCrm()
  const [phone, setPhone] = useState('+998 90 123 45 67')
  const [direction, setDirection] = useState<CallDirection>('inbound')
  const [status, setStatus] = useState<ProviderStatus>('answered')
  const [active, setActive] = useState<{ callId: string; startedAt: number } | null>(null)
  const withPhone = contacts.filter((c) => c.phone)

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const start = () => run(async () => {
    const { call_id } = await telephonyApi.simulate({ action: 'start', phone, direction, status })
    setActive({ callId: call_id, startedAt: Date.now() })
  })

  const end = () => run(async () => {
    if (!active) return
    const duration = status === 'answered' ? Math.round((Date.now() - active.startedAt) / 1000) : 0
    await telephonyApi.simulate({ action: 'end', call_id: active.callId, phone, direction, status, duration })
    setActive(null)
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t('telephony.pickContact')} emptyLabel="—" value="" onChange={(id) => setPhone(withPhone.find((c) => c.id === id)?.phone ?? phone)} options={withPhone.map((c) => ({ value: c.id, label: `${fullName(c)} · ${c.phone}` }))} />
        <TextField label={t('telephony.phone')} value={phone} onChange={setPhone} />
        <Section label={t('calls.direction')}><DirectionPicker value={direction} onChange={setDirection} /></Section>
        <SelectField label={t('telephony.status')} value={status} onChange={(v) => setStatus(v as ProviderStatus)} options={STATUSES.map((s) => ({ value: s.value, label: t(`enums.outcome.${s.outcome}`) }))} />
      </div>
      {active ? (
        <Button variant="destructive" onClick={end}><PhoneOff /> {t('telephony.endCall')}</Button>
      ) : (
        <Button variant="success" onClick={start} disabled={phone.trim().length < 3}><PhoneCall /> {t('telephony.startCall')}</Button>
      )}
    </div>
  )
}
