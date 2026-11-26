import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { SettingRow } from '@/components/common/setting-row'
import { FieldError } from '@/components/common/form-fields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { useFormErrors } from '@/hooks/useFormErrors'
import { useBeforeUnload } from '@/hooks/useUnsaved'
import { authApi } from '@/lib/api'
import { rules } from '@/lib/validation'
import { PasswordDialog } from './PasswordDialog'
import { LanguageSwitch, ThemeSwitch } from './preferences'

/** The display name, edited in place: Save / Cancel appear only once it changes; Enter saves, Esc restores. */
function NameRow() {
  const { t } = useTranslation()
  const { session, updateUser } = useAuth()
  const saved = session?.user.full_name ?? ''
  const [name, setName] = useState(saved)
  const errors = useFormErrors<'name'>('profile-form')
  const { busy, run } = useAsyncAction((err) => errors.fromApi(err, { full_name: 'name' }))
  const dirty = name.trim() !== saved
  useBeforeUnload(dirty)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!dirty || !errors.validate({ name }, { name: [rules.required()] })) return
    const user = await run(() => authApi.updateProfile(name.trim()))
    if (!user) return
    updateUser(user)
    toast.success(t('account.profileSaved'))
  }
  const cancel = () => { setName(saved); errors.clear('name') }

  return (
    <SettingRow label={t('account.name')}>
      <form id="profile-form" onSubmit={submit} noValidate className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:max-w-md sm:justify-end">
        <Input name="name" aria-label={t('account.name')} value={name} onChange={(e) => errors.bind('name', setName)(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && cancel()} aria-invalid={!!errors.message('name')} className="min-w-0 flex-1" />
        {dirty && <Button type="button" variant="ghost" size="sm" onClick={cancel}>{t('common.cancel')}</Button>}
        {dirty && <Button type="submit" size="sm" disabled={busy}>{t('account.saveProfile')}</Button>}
        {errors.message('name') && <div className="w-full"><FieldError id="profile-name-error">{errors.message('name')}</FieldError></div>}
      </form>
    </SettingRow>
  )
}

/**
 * Settings → Profile: everything about you in one card — who you are in this workspace, then one row per setting
 * (name, login, password, theme, language). The demo account is read-only, so its name and password rows are hidden.
 */
export function ProfileSection() {
  const { t } = useTranslation()
  const { session } = useAuth()
  if (!session?.workspace || !session.role) return null
  const demo = session.workspace.is_demo
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <PersonAvatar name={session.user.full_name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{session.user.full_name}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone={demo ? 'amber' : 'green'}>{session.workspace.name}</Badge>
            <Badge tone="violet">{t(`roles.${session.role}`)}</Badge>
          </div>
        </div>
      </div>
      {!demo && <NameRow />}
      <SettingRow label={t('setup.profile.email')} hint={t('setup.profile.emailHint')}>
        <span className="truncate text-sm">{session.user.email}</span>
      </SettingRow>
      {!demo && (
        <SettingRow label={t('account.security')} hint={t('setup.securityDesc')}>
          <PasswordDialog />
        </SettingRow>
      )}
      <SettingRow label={t('settings.theme')}><ThemeSwitch /></SettingRow>
      <SettingRow label={t('settings.language')}><LanguageSwitch /></SettingRow>
    </Card>
  )
}
