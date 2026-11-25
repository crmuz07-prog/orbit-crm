import { useState } from 'react'
import { FlaskConical, Instagram, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CopyField } from '@/components/common/copy-field'
import { SelectField, TextField } from '@/components/common/form-fields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMembers } from '@/features/team/useMembers'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { stagesOf, usePipelines } from '@/hooks/usePipelines'
import { publicApiUrl } from '@/lib/http'
import type { InstagramSettings } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { useInstagramSettings } from './useInstagram'

/** Write-only secrets: the saved value is never shown; typing replaces it. */
function SecretsForm({ settings, save }: { settings: InstagramSettings; save: ReturnType<typeof useInstagramSettings>['update'] }) {
  const { t } = useTranslation()
  const [appSecret, setAppSecret] = useState('')
  const [token, setToken] = useState('')
  const [account, setAccount] = useState(settings.ig_account_id ?? '')
  const submit = () => save.mutate({ ...(appSecret && { app_secret: appSecret }), ...(token && { access_token: token }), ig_account_id: account }, {
    onSuccess: () => { setAppSecret(''); setToken('') },
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} className="grid gap-3 sm:grid-cols-2">
      <TextField label={t('igSettings.appSecret')} type="password" autoComplete="off" value={appSecret} onChange={setAppSecret} placeholder={settings.has_app_secret ? t('igSettings.secretSet') : ''} />
      <TextField label={t('igSettings.accessToken')} type="password" autoComplete="off" value={token} onChange={setToken} placeholder={settings.has_access_token ? t('igSettings.secretSet') : ''} />
      <TextField label={t('igSettings.accountId')} value={account} onChange={setAccount} placeholder="17841400000000000" />
      <div className="flex items-end justify-end"><Button type="submit" variant="outline" disabled={save.isPending}>{t('common.save')}</Button></div>
    </form>
  )
}

/** Settings → Workspace → Instagram (owners and admins). */
export function InstagramCard() {
  const { t } = useTranslation()
  const labels = useLabels()
  const { settings, update, rotate, simulate } = useInstagramSettings()
  const { stages } = useCrm()
  const { pipelines } = usePipelines()
  const { members } = useMembers()
  const [confirm, setConfirm] = useState(false)
  if (!settings) return <Skeleton className="h-72 rounded-2xl" />

  const connected = settings.has_app_secret && settings.has_access_token
  const stageOptions = pipelines.flatMap((p) => stagesOf(stages, p.id).filter((s) => !s.is_won && !s.is_lost)
    .map((s) => ({ value: s.id, label: `${labels.pipeline(p.name)} · ${labels.stage(s.name)}` })))
  return (
    <Card>
      <CardHeader title={<span className="inline-flex items-center gap-2"><Instagram className="size-4 text-pink-500" /> {t('igSettings.title')}</span>}
        description={t('igSettings.description')}
        action={<Badge tone={connected ? 'green' : 'gray'}>{connected ? t('igSettings.connected') : t('igSettings.notConnected')}</Badge>} />
      <CardContent className="space-y-3">
        <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          {(['step1', 'step2', 'step3', 'step4'] as const).map((k) => <li key={k}>{t(`igSettings.${k}`)}</li>)}
        </ol>
        <div className="grid gap-3 sm:grid-cols-2">
          <CopyField label={t('igSettings.callbackUrl')} value={publicApiUrl(settings.webhook_path)} />
          <CopyField label={t('igSettings.verifyToken')} value={settings.verify_token} secret />
        </div>
        <SecretsForm key={String(settings.has_app_secret) + String(settings.has_access_token)} settings={settings} save={update} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label={t('igSettings.stage')} value={settings.stage_id ?? ''} emptyLabel="—" options={stageOptions} onChange={(v) => update.mutate({ stage_id: v || null })} />
          <SelectField label={t('igSettings.owner')} value={settings.owner_id ?? ''} emptyLabel={t('owner.unassigned')}
            options={members.map((m) => ({ value: m.user_id, label: m.full_name }))} onChange={(v) => update.mutate({ owner_id: v || null })} />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-foreground/[0.06] pt-3">
          <Button variant="outline" size="sm" disabled={simulate.isPending} onClick={() => simulate.mutate('message')}><FlaskConical /> {t('instagram.simulateMessage')}</Button>
          <Button variant="outline" size="sm" disabled={simulate.isPending} onClick={() => simulate.mutate('lead_form')}><FlaskConical /> {t('instagram.simulateLead')}</Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setConfirm(true)}><RefreshCw /> {t('igSettings.rotate')}</Button>
          {settings.last_event_at && <span className="w-full text-xs text-muted-foreground">{t('igSettings.lastEvent', { time: timeAgo(settings.last_event_at) })}</span>}
        </div>
      </CardContent>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t('igSettings.rotateConfirm')} description={t('igSettings.rotateDesc')}
        confirmLabel={t('igSettings.rotate')} onConfirm={() => rotate.mutate()} />
    </Card>
  )
}
