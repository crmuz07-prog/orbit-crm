import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { displayStatus, STATUS_TONE } from '@/lib/billing'
import type { PlatformCompany } from '@/lib/types'
import { shortDate } from '@/lib/utils'

export function CompanyStatusBadge({ company }: { company: PlatformCompany }) {
  const { t } = useTranslation()
  const status = displayStatus(company.status, company.days_left)
  return <Badge tone={STATUS_TONE[status]}>{t(`billing.status.${status}`)}</Badge>
}

/** "12 Dec 2026 · 5 days left", or "No end date". */
export function PaidUntil({ company }: { company: PlatformCompany }) {
  const { t } = useTranslation()
  if (!company.subscription_ends_at) return <span className="text-muted-foreground">{t('billing.noEnd')}</span>
  const left = company.days_left ?? 0
  return (
    <span className="whitespace-nowrap">
      {shortDate(company.subscription_ends_at)}
      {left >= 0 && <span className="text-xs text-muted-foreground"> · {t('billing.daysLeft', { count: left })}</span>}
    </span>
  )
}
