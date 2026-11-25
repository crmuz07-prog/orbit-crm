import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import type { Payment } from '@/lib/types'
import { money, shortDate } from '@/lib/utils'

/** Payment history; `withCompany` adds the company column for the platform-wide list. */
export function PaymentsTable({ payments, withCompany = false }: { payments: Payment[]; withCompany?: boolean }) {
  const { t } = useTranslation()
  if (payments.length === 0) return <EmptyState icon={Wallet} title={t('billing.noPayments')} compact />
  const columns: Column<Payment>[] = [
    { key: 'date', header: t('billing.date'), sortValue: (p) => p.created_at, cell: (p) => shortDate(p.created_at) },
    ...(withCompany ? [{ key: 'company', header: t('billing.company'), sortValue: (p: Payment) => p.workspace_name, cell: (p: Payment) => <span className="font-medium">{p.workspace_name}</span> }] : []),
    { key: 'amount', header: t('billing.amount'), align: 'right', sortValue: (p) => p.amount, cell: (p) => <span className="font-medium">{money(p.amount, 'UZS')}</span> },
    { key: 'period', header: t('billing.period'), cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{shortDate(p.period_start)} → {shortDate(p.period_end)}</span> },
    { key: 'seats', header: t('billing.seats'), align: 'right', cell: (p) => p.seats ?? '—' },
    { key: 'note', header: t('billing.note'), cell: (p) => <span className="text-muted-foreground">{p.note ?? '—'}</span> },
  ]
  return <DataTable rows={payments} columns={columns} initialSort={{ key: 'date', dir: 'desc' }} />
}
