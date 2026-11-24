import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToastMutation } from '@/hooks/useToastMutation'
import { adminApi } from '@/lib/api'
import type { AdminUser, CompanyPatch, NewLogin, PaymentDraft, Role } from '@/lib/types'

const KEYS = { companies: ['admin', 'companies'], users: ['admin', 'users'], attempts: ['admin', 'attempts'], payments: ['admin', 'payments'] }

const ALL = Object.values(KEYS)

export function useAdmin() {
  const { t } = useTranslation()
  return {
    companies: useQuery({ queryKey: KEYS.companies, queryFn: adminApi.companies }),
    users: useQuery({ queryKey: KEYS.users, queryFn: adminApi.users }),
    attempts: useQuery({ queryKey: KEYS.attempts, queryFn: adminApi.loginAttempts }),
    payments: useQuery({ queryKey: KEYS.payments, queryFn: adminApi.payments }),
    createCompany: useToastMutation((v: { name: string; owner: NewLogin }) => adminApi.createCompany(v.name, v.owner), t('admin.companyCreated'), ALL),
    renameCompany: useToastMutation((v: { id: string; name: string }) => adminApi.updateCompany(v.id, { name: v.name }), t('admin.renamed'), ALL),
    updateCompany: useToastMutation((v: { id: string; patch: CompanyPatch }) => adminApi.updateCompany(v.id, v.patch), t('billing.saved'), ALL),
    recordPayment: useToastMutation((v: { id: string; draft: PaymentDraft }) => adminApi.recordPayment(v.id, v.draft), t('billing.paymentRecorded'), ALL),
    createUser: useToastMutation((v: NewLogin & { workspace_id: string | null; role: Role }) => adminApi.createUser(v), t('admin.userCreated'), ALL),
    updateUser: useToastMutation((v: { id: string; patch: Partial<Pick<AdminUser, 'is_active' | 'is_superadmin'>> }) => adminApi.updateUser(v.id, v.patch), t('admin.updated'), ALL),
    setPassword: useToastMutation((v: { id: string; password: string }) => adminApi.setPassword(v.id, v.password), t('team.passwordSet'), ALL),
    addMembership: useToastMutation((v: { id: string; workspaceId: string; role: Role }) => adminApi.addMembership(v.id, v.workspaceId, v.role), t('admin.membershipAdded'), ALL),
    removeMembership: useToastMutation((v: { id: string; workspaceId: string }) => adminApi.removeMembership(v.id, v.workspaceId), t('admin.membershipRemoved'), ALL),
  }
}

export type AdminActions = ReturnType<typeof useAdmin>
