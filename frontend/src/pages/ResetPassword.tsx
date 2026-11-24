import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { authApi } from '@/lib/api'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const token = useSearchParams()[0].get('token') ?? ''
  const { busy, run } = useAsyncAction()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error(t('account.mismatch'))
    const session = await run(() => authApi.reset(token, password))
    if (!session) return
    signIn(session)
    toast.success(t('account.resetDone'))
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout title={t('account.resetTitle')}>
      <form onSubmit={submit} className="grid gap-4">
        <TextField label={t('account.newPassword')} type="password" required minLength={8} autoFocus autoComplete="new-password" value={password} onChange={setPassword} />
        <TextField label={t('account.confirmPassword')} type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={setConfirm} />
        <Button type="submit" disabled={busy || !token}>{busy ? t('common.pleaseWait') : t('account.savePassword')}</Button>
      </form>
    </AuthLayout>
  )
}
