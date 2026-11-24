import { useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { DataTable, type Column } from '@/components/common/data-table'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AdminUser } from '@/lib/types'
import { shortDate } from '@/lib/utils'
import { AddToCompanyDialog, CreateUserDialog, SetPasswordDialog } from './UserDialogs'
import { UserActions } from './UserActions'
import type { AdminActions } from './useAdmin'

function Status({ user }: { user: AdminUser }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1">
      <Badge tone={user.is_active ? 'green' : 'red'}>{user.is_active ? t('admin.active') : t('admin.inactive')}</Badge>
      {user.is_superadmin && <Badge tone="violet">{t('admin.superadmin')}</Badge>}
      {user.must_change_password && <Badge tone="amber">{t('team.temporary')}</Badge>}
    </div>
  )
}

export function UsersTab({ actions }: { actions: AdminActions }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [passwordFor, setPasswordFor] = useState<AdminUser | null>(null)
  const [companyFor, setCompanyFor] = useState<AdminUser | null>(null)
  const companies = actions.companies.data ?? []
  const users = (actions.users.data ?? []).filter((u) => matches(query, u.full_name, u.email, ...u.memberships.map((m) => m.workspace_name)))

  const columns: Column<AdminUser>[] = [
    {
      key: 'name', header: t('team.fullName'), sortValue: (u) => u.full_name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <PersonAvatar name={u.full_name} />
          <div className="min-w-0"><p className="font-medium">{u.full_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
        </div>
      ),
    },
    {
      key: 'companies', header: t('admin.companies'),
      cell: (u) => u.memberships.length === 0 ? <span className="text-muted-foreground">—</span> : (
        <div className="flex flex-wrap gap-1">{u.memberships.map((m) => <Badge key={m.workspace_id}>{m.workspace_name} · {t(`roles.${m.role}`)}</Badge>)}</div>
      ),
    },
    { key: 'status', header: t('admin.status'), cell: (u) => <Status user={u} /> },
    { key: 'created', header: t('admin.created'), sortValue: (u) => u.created_at, cell: (u) => <span className="text-muted-foreground">{shortDate(u.created_at)}</span> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (u) => <UserActions user={u} isSelf={u.id === session?.user.id} actions={actions} onSetPassword={setPasswordFor} onAddToCompany={setCompanyFor} />,
    },
  ]

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('admin.search')} />
        <Button className="ml-auto" onClick={() => setCreating(true)}><Plus /> {t('admin.newUser')}</Button>
      </div>
      <Card>
        {actions.users.data?.length === 0 ? <EmptyState icon={Users} title={t('admin.emptyUsers')} /> : (
          <DataTable rows={users} columns={columns} empty={<EmptyState icon={Search} title={t('common.noResults')} />} />
        )}
      </Card>
      <CreateUserDialog open={creating} onOpenChange={setCreating} companies={companies} create={actions.createUser} />
      <SetPasswordDialog user={passwordFor} onClose={() => setPasswordFor(null)} setPassword={actions.setPassword} />
      <AddToCompanyDialog user={companyFor} onClose={() => setCompanyFor(null)} companies={companies} add={actions.addMembership} />
    </>
  )
}
