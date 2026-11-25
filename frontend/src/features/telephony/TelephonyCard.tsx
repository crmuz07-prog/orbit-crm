import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CopyField } from '@/components/common/copy-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { telephonyApi } from '@/lib/api'
import { publicApiUrl } from '@/lib/http'
import type { TelephonySettings } from '@/lib/types'
import { CallSimulator } from './CallSimulator'

const KEY = ['telephony']

const EXAMPLE = `{
  "event": "call.ended",        // call.ringing | call.answered | call.ended | call.missed
  "call_id": "pbx-8f2c1",       // provider call id (idempotency key)
  "direction": "inbound",       // inbound | outbound
  "from": "+998901234567",
  "to": "+998712000000",
  "duration": 245,              // seconds
  "status": "answered",         // answered | no_answer | busy | voicemail | failed
  "recording_url": "https://…"
}`

function useTelephony() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: KEY, queryFn: telephonyApi.settings })
  const save = (data: TelephonySettings) => qc.setQueryData(KEY, data)
  const update = useMutation({ mutationFn: telephonyApi.update, onSuccess: save })
  const rotate = useMutation({ mutationFn: telephonyApi.rotate, onSuccess: save })
  return { settings: query.data, update, rotate }
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="rounded-md" /> {label}
    </label>
  )
}

/** Settings → Telephony: connect a PBX by webhook and test the pipeline with the simulator. */
export function TelephonyCard() {
  const { t } = useTranslation()
  const { settings, update, rotate } = useTelephony()
  const [confirm, setConfirm] = useState(false)
  if (!settings) return <Skeleton className="h-96 rounded-2xl" />

  return (
    <Card>
      <CardHeader title={t('telephony.title')} description={t('telephony.description')} action={<Button size="sm" variant="outline" onClick={() => setConfirm(true)}><RefreshCw /> {t('telephony.rotate')}</Button>} />
      <CardContent className="space-y-3">
        <ol className="glass-subtle space-y-2 rounded-xl p-4 text-sm">
          <p className="font-medium">{t('telephony.howTitle')}</p>
          {(['how1', 'how2', 'how3'] as const).map((key, i) => (
            <li key={key} className="flex gap-3 text-muted-foreground">
              <span className="glass-glow flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white">{i + 1}</span>
              {t(`telephony.${key}`)}
            </li>
          ))}
        </ol>
        <CopyField label={t('telephony.webhookUrl')} value={publicApiUrl(settings.webhook_path)} />
        <div className="space-y-1">
          <CopyField label={t('telephony.secret')} value={settings.signing_secret} secret />
          <p className="text-xs text-muted-foreground">{t('telephony.signatureHint')}</p>
        </div>
        <div className="space-y-2">
          <Toggle label={t('telephony.createUnknown')} checked={settings.create_unknown_contacts} onChange={(v) => update.mutate({ create_unknown_contacts: v })} />
          <Toggle label={t('telephony.callbackTask')} checked={settings.callback_task_on_missed} onChange={(v) => update.mutate({ callback_task_on_missed: v })} />
        </div>
        <details className="glass-subtle rounded-xl p-3 text-sm">
          <summary className="cursor-pointer font-medium">{t('telephony.payload')}</summary>
          <pre className="mt-3 overflow-x-auto text-xs text-muted-foreground">{EXAMPLE}</pre>
        </details>
        <div className="space-y-3 border-t border-foreground/[0.06] pt-3">
          <div>
            <p className="font-medium">{t('telephony.simulator')}</p>
            <p className="text-sm text-muted-foreground">{t('telephony.simulatorDesc')}</p>
          </div>
          <CallSimulator />
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('telephony.rotateConfirm')}
        description={t('telephony.rotateConfirmDesc')}
        confirmLabel={t('telephony.rotate')}
        onConfirm={() => rotate.mutate(undefined, { onSuccess: () => toast.success(t('telephony.rotated')) })}
      />
    </Card>
  )
}
