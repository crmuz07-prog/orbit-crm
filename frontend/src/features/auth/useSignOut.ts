import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { useConfirm } from '@/components/common/confirm-provider'

/** Sign-out after a confirmation (a stray click must not end the session and drop unsaved work). */
export function useConfirmedSignOut() {
  const { signOut } = useAuth()
  const confirm = useConfirm()
  const { t } = useTranslation()
  return async () => {
    if (await confirm({ title: t('confirm.signOut.title'), description: t('confirm.signOut.desc'), confirmLabel: t('confirm.signOut.action'), tone: 'default' })) signOut()
  }
}
