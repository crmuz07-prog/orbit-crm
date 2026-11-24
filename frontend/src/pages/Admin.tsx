import { Building2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Page } from '@/components/common/page'
import { PageSkeleton } from '@/components/common/states'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompaniesTab } from '@/features/admin/CompaniesTab'
import { useAdmin } from '@/features/admin/useAdmin'
import { UsersTab } from '@/features/admin/UsersTab'
import { usePersistentState } from '@/hooks/usePersistentState'

const TABS = ['companies', 'users'] as const

/** Platform administration for superadmins (ERP-style provisioning of companies and logins). */
export default function AdminPage() {
  const { t } = useTranslation()
  const actions = useAdmin()
  const [tab, setTab] = usePersistentState('orbit:admin-tab', 'companies', TABS)
  if (actions.companies.isLoading || actions.users.isLoading) return <PageSkeleton />

  return (
    <Page title={t('admin.title')} description={t('admin.description')}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}>
        <TabsList className="mb-4">
          <TabsTrigger value="companies"><Building2 /> {t('admin.companies')} <span className="opacity-60">{actions.companies.data?.length}</span></TabsTrigger>
          <TabsTrigger value="users"><Users /> {t('admin.users')} <span className="opacity-60">{actions.users.data?.length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="companies"><CompaniesTab actions={actions} /></TabsContent>
        <TabsContent value="users"><UsersTab actions={actions} /></TabsContent>
      </Tabs>
    </Page>
  )
}
