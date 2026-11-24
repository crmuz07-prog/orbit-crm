import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { LoginAttempt } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import type { AdminActions } from './useAdmin'

/** Recent sign-in attempts (the data behind the rate limit), newest first. */
export function SecurityTab({ actions }: { actions: AdminActions }) {
  const { t } = useTranslation()
  const attempts = actions.attempts.data ?? []
  const columns: Column<LoginAttempt>[] = [
    { key: 'email', header: t('security.email'), sortValue: (a) => a.email, cell: (a) => <span className="font-medium">{a.email}</span> },
    { key: 'ip', header: t('security.ip'), cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.ip ?? '—'}</span> },
    {
      key: 'result', header: t('security.result'), sortValue: (a) => Number(a.success),
      cell: (a) => <Badge tone={a.success ? 'green' : 'red'}>{a.success ? t('security.success') : t('security.failed')}</Badge>,
    },
    { key: 'time', header: t('security.time'), sortValue: (a) => a.created_at, cell: (a) => <span className="text-muted-foreground" title={a.created_at}>{timeAgo(a.created_at)}</span> },
  ]
  return (
    <Card>
      {attempts.length === 0 ? <EmptyState icon={ShieldCheck} title={t('security.empty')} /> : (
        <DataTable rows={attempts} columns={columns} initialSort={{ key: 'time', dir: 'desc' }} />
      )}
    </Card>
  )
}
