import { useTranslation } from 'react-i18next'
import { CopyField } from './copy-field'

/** Shown right after an admin issues a login, so the credentials can be handed over once. */
export function CredentialsCard({ email, password }: { email: string; password: string }) {
  const { t } = useTranslation()
  return (
    <div className="glass-subtle space-y-3 rounded-xl p-4">
      <p className="text-sm font-medium">{t('team.credentials')}</p>
      <CopyField label={t('team.email')} value={email} />
      <CopyField label={t('team.tempPassword')} value={password} secret />
      <p className="text-xs text-muted-foreground">{t('team.credentialsHint')}</p>
    </div>
  )
}
