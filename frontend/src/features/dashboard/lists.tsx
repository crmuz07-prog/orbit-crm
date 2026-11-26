import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompanyLogo } from '@/components/common/avatars'
import { ListCard, RowLink } from '@/components/common/record'
import { EmptyState } from '@/components/common/states'
import { ActivityRow } from '@/features/activities/ActivityRow'
import { DueLabel } from '@/features/activities/DueLabel'
import { StageBadge } from '@/features/deals/bits'
import { useCrm } from '@/hooks/useData'
import { daysSince, dueBucket } from '@/lib/metrics'
import type { Dashboard, Deal } from '@/lib/types'
import { money, timeAgo, toDate } from '@/lib/utils'

const viewAll = (to: string, label: string) => <Link to={to} className="text-xs font-medium text-primary hover:underline">{label}</Link>

export function TasksCard() {
  const { activities } = useCrm()
  const { t } = useTranslation()
  const tasks = activities
    .filter((a) => ['overdue', 'today'].includes(dueBucket(a)))
    .sort((a, b) => toDate(a.due_at!).getTime() - toDate(b.due_at!).getTime())
    .slice(0, 7)
  return (
    <ListCard
      title={t('dashboard.tasks')}
      description={t('dashboard.tasksDesc')}
      action={viewAll('/tasks', t('common.viewAll'))}
      items={tasks}
      empty={<EmptyState icon={CalendarCheck} title={t('dashboard.tasksEmpty')} description={t('dashboard.tasksEmptyDesc')} compact />}
      render={(a) => <ActivityRow activity={a} compact meta={<DueLabel activity={a} />} />}
    />
  )
}

/**
 * Deals worth a look now: the biggest open deals when deals carry amounts, otherwise the newest leads (a list of
 * "0 so'm" says nothing). Each line: title, stage, and the amount or how long ago it came in.
 */
export function DealsFocusCard({ data, withMoney }: { data: Pick<Dashboard, 'top_open' | 'recent_open'>; withMoney: boolean }) {
  const { companyById, stageById } = useCrm()
  const { t } = useTranslation()
  const deals = withMoney ? data.top_open : data.recent_open
  return (
    <ListCard
      title={withMoney ? t('overview.biggest') : t('overview.recent')}
      description={withMoney ? t('overview.biggestDesc') : t('overview.recentDesc')}
      action={viewAll('/deals', t('overview.allDeals'))}
      items={deals}
      empty={<EmptyState icon={CalendarCheck} title={t('dashboard.noOpenDeals')} compact />}
      render={(d) => (
        <RowLink to={`/deals/${d.id}`}>
          <CompanyLogo name={(d.company_id && companyById.get(d.company_id)?.name) || d.title} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.title}</p>
            <div className="mt-0.5"><StageBadge stage={stageById.get(d.stage_id)} className="max-w-full" /></div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {withMoney ? <b className="text-sm font-semibold text-foreground">{money(d.amount, d.currency, true)}</b> : timeAgo(d.created_at)}
          </span>
        </RowLink>
      )}
    />
  )
}

export function AtRiskCard({ deals }: { deals: Deal[] }) {
  const { t } = useTranslation()
  return (
    <ListCard
      title={t('overview.stale')}
      description={t('overview.staleDesc')}
      items={deals.slice(0, 6)}
      empty={<EmptyState icon={AlertTriangle} title={t('dashboard.healthy')} description={t('dashboard.healthyDesc')} compact />}
      render={(d) => (
        <RowLink to={`/deals/${d.id}`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-500/10"><AlertTriangle className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.title}</p>
            <p className="text-xs text-muted-foreground">{t('overview.idle', { days: daysSince(d.updated_at) })}</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        </RowLink>
      )}
    />
  )
}
