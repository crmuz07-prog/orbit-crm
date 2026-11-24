import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { useFormErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/api'
import { ApiError } from '@/lib/http'
import { newPassword, rules } from '@/lib/validation'

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
    <form id="profile-form" onSubmit={submit} noValidate className="flex flex-wrap items-start gap-3">
      <div className="min-w-[220px] flex-1"><TextField name="name" label={t('account.name')} value={name} onChange={(v) => { setName(v); errors.clear('name') }} error={errors.message('name')} /></div>
      <Button type="submit" variant="outline" className="mt-6" disabled={busy}>{t('account.saveProfile')}</Button>
    </form>
  )
}

function PasswordForm() {
  const { t } = useTranslation()
  const { session, signIn } = useAuth()
  const errors = useFormErrors<'current' | 'next'>('password-form')
  const wrongCurrent = (err: unknown) => err instanceof ApiError && err.code === 'wrong_password' && errors.fromApi(new ApiError(400, '', err.code, [{ field: 'current', code: 'wrong_password' }]))
  const { busy, run } = useAsyncAction((err) => errors.fromApi(err, { new_password: 'next', current_password: 'current' }) || wrongCurrent(err))
  const hasPassword = session?.user.has_password ?? true
  const [current, setCurrentValue] = useState('')
  const [next, setNextValue] = useState('')
  const setCurrent = (v: string) => { setCurrentValue(v); errors.clear('current') }
  const setNext = (v: string) => { setNextValue(v); errors.clear('next') }

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
    <form id="password-form" onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
      {hasPassword && <TextField name="current" label={t('account.currentPassword')} type="password" autoComplete="current-password" value={current} onChange={setCurrent} error={errors.message('current')} />}
      <TextField name="next" label={t('account.newPassword')} type="password" autoComplete="new-password" value={next} onChange={setNext} error={errors.message('next')} />
      <Button type="submit" variant="outline" className="sm:mt-6" disabled={busy}>{hasPassword ? t('account.changePassword') : t('account.setFirstPassword')}</Button>
    </form>
  )
}

/** Settings → Account: profile name and password (hidden for the shared demo account). */
export function AccountCard() {
  const { t } = useTranslation()
  const { session } = useAuth()
  if (!session || session.workspace?.is_demo) return null
  return (
    <Card>
      <CardHeader title={t('account.profile')} description={session.user.email} />
      <CardContent className="space-y-4">
        <ProfileForm />
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('account.security')}</p>
          <PasswordForm />
        </div>
      </CardContent>
    </Card>
  )
}
