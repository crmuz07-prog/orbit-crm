import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { SUBSCRIPTION_WARNING_DAYS } from '@/lib/types'
import { shortDate } from '@/lib/utils'

/** Owners and admins are told a week ahead that the subscription is about to end (erp1 warning window). */
export function SubscriptionBanner() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const workspace = session?.workspace
  const days = workspace?.days_left
  const manager = session?.role === 'owner' || session?.role === 'admin'
  if (!workspace || !manager || workspace.status !== 'active' || days == null || days < 0 || days > SUBSCRIPTION_WARNING_DAYS) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-300">
      <CalendarClock className="size-3.5" />
      {t('billing.warning', { count: days, date: shortDate(workspace.subscription_ends_at) })}
    </div>
  )
}
