import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { useFormErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/api'
import { newPassword, rules } from '@/lib/validation'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const token = useSearchParams()[0].get('token') ?? ''
  const errors = useFormErrors<'password' | 'confirm'>('reset-form')
  const { busy, run } = useAsyncAction(errors.fromApi)
  const [form, setForm] = useState({ password: '', confirm: '' })
  const set = (key: keyof typeof form) => (value: string) => { setForm((f) => ({ ...f, [key]: value })); errors.clear(key) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate(form, { password: newPassword(), confirm: [rules.required(), rules.same(() => form.password)] })) return
    const session = await run(() => authApi.reset(token, form.password))
    if (!session) return
    signIn(session)
    toast.success(t('account.resetDone'))
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout title={t('account.resetTitle')}>
      <form id="reset-form" onSubmit={submit} noValidate className="grid gap-4">
        <TextField name="password" label={t('account.newPassword')} type="password" autoFocus autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.message('password')} />
        <TextField name="confirm" label={t('account.confirmPassword')} type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.message('confirm')} />
        <Button type="submit" disabled={busy || !token}>{busy ? t('common.pleaseWait') : t('account.savePassword')}</Button>
      </form>
    </AuthLayout>
  )
}
