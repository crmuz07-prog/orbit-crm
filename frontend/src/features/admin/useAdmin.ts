import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import type { AdminUser, NewLogin, Role } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

const KEYS = { companies: ['admin', 'companies'], users: ['admin', 'users'] }

/** A platform mutation: refreshes companies and users (they reference each other) and confirms with a toast. */
function useAdminMutation<A, R>(fn: (arg: A) => Promise<R>, success: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success)
      return Promise.all(Object.values(KEYS).map((queryKey) => qc.invalidateQueries({ queryKey })))
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}

export function useAdmin() {
  const { t } = useTranslation()
  return {
    companies: useQuery({ queryKey: KEYS.companies, queryFn: adminApi.companies }),
    users: useQuery({ queryKey: KEYS.users, queryFn: adminApi.users }),
    createCompany: useAdminMutation((v: { name: string; owner: NewLogin }) => adminApi.createCompany(v.name, v.owner), t('admin.companyCreated')),
    renameCompany: useAdminMutation((v: { id: string; name: string }) => adminApi.renameCompany(v.id, v.name), t('admin.renamed')),
    createUser: useAdminMutation((v: NewLogin & { workspace_id: string | null; role: Role }) => adminApi.createUser(v), t('admin.userCreated')),
    updateUser: useAdminMutation((v: { id: string; patch: Partial<Pick<AdminUser, 'is_active' | 'is_superadmin'>> }) => adminApi.updateUser(v.id, v.patch), t('admin.updated')),
    setPassword: useAdminMutation((v: { id: string; password: string }) => adminApi.setPassword(v.id, v.password), t('team.passwordSet')),
    addMembership: useAdminMutation((v: { id: string; workspaceId: string; role: Role }) => adminApi.addMembership(v.id, v.workspaceId, v.role), t('admin.membershipAdded')),
    removeMembership: useAdminMutation((v: { id: string; workspaceId: string }) => adminApi.removeMembership(v.id, v.workspaceId), t('admin.membershipRemoved')),
  }
}

export type AdminActions = ReturnType<typeof useAdmin>
