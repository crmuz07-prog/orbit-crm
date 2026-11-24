import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldBan, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { adminApi } from '@/lib/api'
import type { PlatformCompany } from '@/lib/types'
import { money } from '@/lib/utils'
import type { AdminActions } from '../useAdmin'
import { CompanyStatusBadge, PaidUntil } from './CompanyStatusBadge'
import { LimitsForm } from './LimitsForm'
import { PaymentForm } from './PaymentForm'
import { PaymentsTable } from './PaymentsTable'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate text-sm font-medium">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </section>
  )
}

function BillingBody({ company, actions }: { company: PlatformCompany; actions: AdminActions }) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const payments = useQuery({ queryKey: ['admin', 'payments', company.id], queryFn: () => adminApi.companyPayments(company.id) })
  const blocked = company.status === 'blocked'
  const toggle = () => actions.updateCompany.mutate({ id: company.id, patch: { status: blocked ? 'active' : 'blocked' } })
  const seats = company.seat_limit ? t('billing.seatsUsed', { used: company.seats_used, limit: company.seat_limit }) : `${company.seats_used} · ${t('billing.unlimited')}`

  return (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <div className="glass-subtle grid grid-cols-2 gap-4 rounded-xl p-4 sm:grid-cols-4">
        <Fact label={t('admin.status')}><CompanyStatusBadge company={company} /></Fact>
        <Fact label={t('billing.paidUntil')}><PaidUntil company={company} /></Fact>
        <Fact label={t('billing.seats')}>{seats}</Fact>
        <Fact label={t('billing.total')}>{money(company.price_paid, 'UZS')}</Fact>
      </div>
      <Section title={t('billing.recordPayment')}><PaymentForm company={company} record={actions.recordPayment} /></Section>
      <Section title={t('billing.limits')}><LimitsForm key={`${company.seat_limit}-${company.subscription_ends_at}`} company={company} update={actions.updateCompany} /></Section>
      <Section title={t('billing.history')}><PaymentsTable payments={payments.data ?? []} /></Section>
      <div className="flex justify-end border-t border-foreground/[0.06] pt-4">
        {blocked ? <Button variant="outline" onClick={toggle}><ShieldCheck /> {t('billing.unblock')}</Button>
          : <Button variant="destructive" onClick={() => setConfirm(true)}><ShieldBan /> {t('billing.block')}</Button>}
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t('billing.blockConfirm', { name: company.name })}
        description={t('billing.blockDesc')} confirmLabel={t('billing.block')} onConfirm={toggle} />
    </div>
  )
}

/** Superadmin → company subscription: payments, limits, block (erp1 tenant page). Reads the live row by id. */
export function CompanyBillingDialog({ companyId, onClose, actions }: { companyId: string | null; onClose: () => void; actions: AdminActions }) {
  const company = actions.companies.data?.find((c) => c.id === companyId)
  const { t } = useTranslation()
  return (
    <Dialog open={!!companyId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{t('billing.manage')} · {company?.name}</DialogTitle></DialogHeader>
        {company && <BillingBody company={company} actions={actions} />}
      </DialogContent>
    </Dialog>
  )
}
