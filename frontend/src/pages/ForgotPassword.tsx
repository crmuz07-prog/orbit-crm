import { useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { authApi } from '@/lib/api'
import { withRetry } from '@/lib/http'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { busy, attempt } = useAsyncAction()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
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
      <form onSubmit={submit} className="grid gap-4">
        <TextField label={t('auth.email')} type="email" required autoFocus value={email} onChange={setEmail} placeholder="you@company.com" />
        <Button type="submit" disabled={busy}>{busy ? t('common.pleaseWait') : t('account.sendLink')}</Button>
      </form>
      {back}
    </AuthLayout>
  )
}
