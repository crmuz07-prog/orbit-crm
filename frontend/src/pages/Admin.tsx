import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Page } from '@/components/common/page'
import { PageSkeleton } from '@/components/common/states'
import { PaymentsTab } from '@/features/admin/billing/PaymentsTab'
import { CompaniesTab } from '@/features/admin/CompaniesTab'
import { SecurityTab } from '@/features/admin/SecurityTab'
import { useAdmin, type AdminActions } from '@/features/admin/useAdmin'
import { UsersTab } from '@/features/admin/UsersTab'

const SECTIONS = {
  companies: { title: 'admin.companies', Body: CompaniesTab },
  users: { title: 'admin.users', Body: UsersTab },
  payments: { title: 'billing.tab', Body: PaymentsTab },
  security: { title: 'security.tab', Body: SecurityTab },
} as const satisfies Record<string, { title: string; Body: (props: { actions: AdminActions }) => JSX.Element }>

type Section = keyof typeof SECTIONS

/** Platform administration; each section is a sidebar entry, laid out like any other page of the app. */
export default function AdminPage() {
  const { t } = useTranslation()
  const { section } = useParams()
  const actions = useAdmin()
  if (!section || !(section in SECTIONS)) return <Navigate to="/admin/companies" replace />
  if (actions.companies.isLoading || actions.users.isLoading) return <PageSkeleton />

  const key = section as Section
  const { title, Body } = SECTIONS[key]
  return (
    <Page title={t(title)} description={t(`admin.sectionDesc.${key}`)}>
      <Body actions={actions} />
    </Page>
  )
}
