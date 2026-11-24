import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { authApi } from '@/lib/api'

function ProfileForm() {
  const { t } = useTranslation()
  const { session, updateUser } = useAuth()
  const { busy, run } = useAsyncAction()
  const [name, setName] = useState(session?.user.full_name ?? '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const user = await run(() => authApi.updateProfile(name.trim()))
    if (!user) return
    updateUser(user)
    toast.success(t('account.profileSaved'))
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[220px] flex-1"><TextField label={t('account.name')} required value={name} onChange={setName} /></div>
      <Button type="submit" variant="outline" disabled={busy || !name.trim()}>{t('account.saveProfile')}</Button>
    </form>
  )
}

function PasswordForm() {
  const { t } = useTranslation()
  const { session, signIn } = useAuth()
  const { busy, run } = useAsyncAction()
  const hasPassword = session?.user.has_password ?? true
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    // Other devices are signed out; this one continues with the fresh token.
    const token = await run(() => authApi.changePassword(hasPassword ? current : null, next))
    if (!token) return
    signIn(token)
    setCurrent('')
    setNext('')
    toast.success(t('account.passwordChanged'))
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      {hasPassword && <TextField label={t('account.currentPassword')} type="password" required autoComplete="current-password" value={current} onChange={setCurrent} />}
      <TextField label={t('account.newPassword')} type="password" required minLength={8} autoComplete="new-password" value={next} onChange={setNext} />
      <Button type="submit" variant="outline" disabled={busy}>{hasPassword ? t('account.changePassword') : t('account.setFirstPassword')}</Button>
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
