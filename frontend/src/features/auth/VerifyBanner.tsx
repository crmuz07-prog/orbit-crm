import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { authApi } from '@/lib/api'

/** Non-blocking reminder to confirm the email address (HubSpot / Linear pattern). */
export function VerifyBanner() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { busy, attempt } = useAsyncAction()
  if (!session || session.user.email_verified || session.workspace?.is_demo) return null

  const resend = async () => {
    if (await attempt(authApi.resendVerification)) toast.success(t('account.resent'))
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-700 backdrop-blur dark:text-amber-300">
      {t('account.banner', { email: session.user.email })}
      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={busy} onClick={resend}>{t('account.resend')}</Button>
    </div>
  )
}
