import { useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { authApi } from '@/lib/api'
import { useFormErrors } from '@/hooks/useFormErrors'
import { withRetry } from '@/lib/http'
import { rules } from '@/lib/validation'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const errors = useFormErrors<'email'>('forgot-form')
  const { busy, attempt } = useAsyncAction(errors.fromApi)
  const [email, setEmailValue] = useState('')
  const setEmail = (v: string) => { setEmailValue(v); errors.clear('email') }
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ email }, { email: [rules.required(), rules.email()] })) return
    // The API answers the same way for unknown emails, so this never reveals whether an account exists.
    if (await attempt(() => withRetry(() => authApi.forgot(email)))) setSent(true)
  }

  const back = <Link to="/" className="mt-6 block text-center text-sm font-medium text-primary hover:underline">{t('account.backToSignIn')}</Link>

  if (sent) {
    return (
      <AuthLayout title={t('account.sentTitle')}>
        <div className="glass-subtle flex gap-3 rounded-xl p-4 text-sm text-muted-foreground">
          <MailCheck className="size-5 shrink-0 text-primary" /> {t('account.sentSub', { email })}
        </div>
        {back}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('account.forgotTitle')} subtitle={t('account.forgotSub')}>
      <form id="forgot-form" onSubmit={submit} noValidate className="grid gap-4">
        <TextField name="email" label={t('auth.email')} type="email" autoFocus value={email} onChange={setEmail} error={errors.message('email')} placeholder={t('examples.email')} />
        <Button type="submit" disabled={busy}>{busy ? t('common.pleaseWait') : t('account.sendLink')}</Button>
      </form>
      {back}
    </AuthLayout>
  )
}
