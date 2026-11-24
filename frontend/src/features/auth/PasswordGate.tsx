import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { useFormErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/api'
import { newPassword, rules } from '@/lib/validation'
import { AuthLayout } from './AuthLayout'
import { useAsyncAction } from './useAsyncAction'

/** First sign-in with an admin-issued password: the person must choose their own before using the CRM. */
export function PasswordGate() {
  const { t } = useTranslation()
  const { session, signIn, signOut } = useAuth()
  const errors = useFormErrors<'current' | 'next' | 'confirm'>('gate-form')
  // A wrong current password belongs under that field, not in a toast.
  const { busy, run } = useAsyncAction((e) => errors.fromApi(e, { new_password: 'next', current_password: 'current' }, { code: 'wrong_password', field: 'current' }))
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const set = (key: keyof typeof form) => (value: string) => { setForm((f) => ({ ...f, [key]: value })); errors.clear(key) }
  if (!session) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const valid = errors.validate(form, { current: [rules.required()], next: newPassword(), confirm: [rules.required(), rules.same(() => form.next)] })
    if (!valid) return
    const token = await run(() => authApi.changePassword(form.current, form.next))
    if (!token) return
    signIn(token)
    toast.success(t('gate.done'))
  }

  return (
    <AuthLayout title={t('gate.title')} subtitle={t('gate.subtitle')}>
      <form id="gate-form" onSubmit={submit} noValidate className="grid gap-4">
        <TextField name="current" label={t('account.currentPassword')} type="password" autoFocus autoComplete="current-password" value={form.current} onChange={set('current')} error={errors.message('current')} />
        <TextField name="next" label={t('account.newPassword')} type="password" autoComplete="new-password" value={form.next} onChange={set('next')} error={errors.message('next')} />
        <TextField name="confirm" label={t('account.confirmPassword')} type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.message('confirm')} />
        <Button type="submit" disabled={busy}>{busy ? t('common.pleaseWait') : t('gate.save')}</Button>
        <Button variant="ghost" onClick={signOut}>{t('nav.signOut')}</Button>
      </form>
    </AuthLayout>
  )
}
