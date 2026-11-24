import { useTranslation } from 'react-i18next'
import { Card, CardHeader } from '@/components/ui/card'
import { money } from '@/lib/utils'
import type { AdminActions } from '../useAdmin'
import { PaymentsTable } from './PaymentsTable'

/** Every payment on the platform with the total received (erp1 /admin/payments). */
export function PaymentsTab({ actions }: { actions: AdminActions }) {
  const { t } = useTranslation()
  const payments = actions.payments.data ?? []
  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  return (
    <Card>
      <CardHeader title={t('billing.history')} action={<span className="text-sm font-semibold">{t('billing.total')}: {money(total, 'UZS')}</span>} />
      <PaymentsTable payments={payments} withCompany />
    </Card>
  )
}
