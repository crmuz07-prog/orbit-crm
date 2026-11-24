import { CalendarX, LogOut, ShieldBan } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth, useWorkspaceSession } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { WorkspaceSwitcher } from '@/features/auth/WorkspaceSwitcher'

/** Shown instead of the CRM when the active company's subscription ended or it was blocked. */
export function SubscriptionClosed() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { workspace } = useWorkspaceSession()
  const blocked = workspace.status === 'blocked'
  const Icon = blocked ? ShieldBan : CalendarX
  return (
    <AuthLayout title={blocked ? t('billing.blockedTitle') : t('billing.expiredTitle')}
      subtitle={blocked ? t('billing.blockedDesc', { name: workspace.name }) : t('billing.expiredDesc', { name: workspace.name })}>
      <div className="grid gap-4">
        <div className="glass-subtle flex items-center gap-3 rounded-xl p-4">
          <Icon className="size-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{workspace.name}</span>
        </div>
        {/* People in several companies can keep working in another one. */}
        <WorkspaceSwitcher />
        <Button variant="outline" onClick={signOut}><LogOut /> {t('nav.signOut')}</Button>
      </div>
    </AuthLayout>
  )
}
