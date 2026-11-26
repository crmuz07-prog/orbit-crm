import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { PersonAvatar } from '@/components/common/avatars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { useFormErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/api'
import { MIN_PASSWORD, newPassword, rules } from '@/lib/validation'
import { AppearanceCard } from './AppearanceCard'

function ProfileForm() {
  const { t } = useTranslation()
  const { session, updateUser } = useAuth()
  const errors = useFormErrors<'name'>('profile-form')
  const { busy, run } = useAsyncAction((err) => errors.fromApi(err, { full_name: 'name' }))
  const [name, setName] = useState(session?.user.full_name ?? '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ name }, { name: [rules.required()] })) return
    const user = await run(() => authApi.updateProfile(name.trim()))
    if (!user) return
    updateUser(user)
    toast.success(t('account.profileSaved'))
  }

  return (
    <form id="profile-form" onSubmit={submit} noValidate className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="name" label={t('account.name')} value={name} onChange={errors.bind('name', setName)} error={errors.message('name')} />
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">{t('setup.profile.email')}</Label>
          <Input id="profile-email" value={session?.user.email ?? ''} readOnly disabled />
          <p className="text-xs text-muted-foreground">{t('setup.profile.emailHint')}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={busy || !name.trim() || name.trim() === session?.user.full_name}>{t('account.saveProfile')}</Button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const { t } = useTranslation()
  const { session, signIn } = useAuth()
  const errors = useFormErrors<'current' | 'next'>('password-form')
  const { busy, run } = useAsyncAction((err) => errors.fromApi(err, { new_password: 'next', current_password: 'current' }, { code: 'wrong_password', field: 'current' }))
  const hasPassword = session?.user.has_password ?? true
  const [current, setCurrentValue] = useState('')
  const [next, setNextValue] = useState('')
  const setCurrent = errors.bind('current', setCurrentValue)
  const setNext = errors.bind('next', setNextValue)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ current, next }, { ...(hasPassword ? { current: [rules.required()] } : {}), next: newPassword() })) return
    // Other devices are signed out; this one continues with the fresh token.
    const token = await run(() => authApi.changePassword(hasPassword ? current : null, next))
    if (!token) return
    signIn(token)
    setCurrent('')
    setNext('')
    toast.success(t('account.passwordChanged'))
  }

  return (
    <form id="password-form" onSubmit={submit} noValidate className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {hasPassword && <TextField name="current" label={t('account.currentPassword')} type="password" autoComplete="current-password" value={current} onChange={setCurrent} error={errors.message('current')} />}
        <TextField name="next" label={t('account.newPassword')} type="password" autoComplete="new-password" value={next} onChange={setNext} error={errors.message('next')} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t('setup.profile.passwordHint', { min: MIN_PASSWORD })}</p>
        <Button type="submit" variant="outline" disabled={busy || !next}>{hasPassword ? t('account.changePassword') : t('account.setFirstPassword')}</Button>
      </div>
    </form>
  )
}

/** Who you are in this workspace: avatar, name, login, company and role — and the name you can change. */
export function ProfileCard() {
  const { t } = useTranslation()
  const { session } = useAuth()
  if (!session?.workspace || !session.role) return null
  return (
    <Card>
      <CardHeader title={t('setup.nav.profile')} />
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <PersonAvatar name={session.user.full_name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{session.user.full_name}</p>
          <p className="truncate text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={session.workspace.is_demo ? 'amber' : 'green'}>{session.workspace.name}</Badge>
          <Badge tone="violet">{t(`roles.${session.role}`)}</Badge>
        </div>
      </div>
      {/* The shared demo account is read-only. */}
      {!session.workspace.is_demo && <CardContent className="border-t border-foreground/[0.06]"><ProfileForm /></CardContent>}
    </Card>
  )
}

/** Your password (a first one for accounts created without it). */
export function PasswordCard() {
  const { t } = useTranslation()
  const { session } = useAuth()
  if (!session || session.workspace?.is_demo) return null
  return (
    <Card>
      <CardHeader title={t('account.security')} description={t('setup.securityDesc')} />
      <CardContent><PasswordForm /></CardContent>
    </Card>
  )
}

/** Settings → Profile: everything about you on one page — identity and name, password, appearance. */
export function ProfileSection() {
  return (
    <>
      <ProfileCard />
      <PasswordCard />
      <AppearanceCard />
    </>
  )
}
