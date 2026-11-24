import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api'
import { AuthLayout } from './AuthLayout'
import { useAsyncAction } from './useAsyncAction'

/** First sign-in with an admin-issued password: the person must choose their own before using the CRM. */
export function PasswordGate() {
  const { t } = useTranslation()
  const { session, signIn, signOut } = useAuth()
  const { busy, run } = useAsyncAction()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  if (!session) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== confirm) return toast.error(t('account.mismatch'))
    const token = await run(() => authApi.changePassword(current, next))
    if (!token) return
    signIn(token)
    toast.success(t('gate.done'))
  }

  return (
    <AuthLayout title={t('gate.title')} subtitle={t('gate.subtitle')}>
      <form onSubmit={submit} className="grid gap-4">
        <TextField label={t('account.currentPassword')} type="password" required autoFocus autoComplete="current-password" value={current} onChange={setCurrent} />
        <TextField label={t('account.newPassword')} type="password" required minLength={8} autoComplete="new-password" value={next} onChange={setNext} />
        <TextField label={t('account.confirmPassword')} type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={setConfirm} />
        <Button type="submit" disabled={busy}>{busy ? t('common.pleaseWait') : t('gate.save')}</Button>
        <Button variant="ghost" onClick={signOut}>{t('nav.signOut')}</Button>
      </form>
    </AuthLayout>
  )
}
