import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToastMutation } from '@/hooks/useToastMutation'
import { accessApi } from '@/lib/api'
import type { Permissions } from '@/lib/types'

const KEYS = [['access'], ['team']]

/** Settings → Roles & access and Sales teams (owners and admins only). */
export function useAccessConfig(enabled = true) {
  const { t } = useTranslation()
  return {
    config: useQuery({ queryKey: ['access'], queryFn: accessApi.get, enabled }).data,
    createRole: useToastMutation((v: { name: string; permissions: Permissions }) => accessApi.createRole(v.name, v.permissions), t('access.created'), KEYS),
    updateRole: useToastMutation((v: { id: string; name?: string; permissions?: Permissions; is_default?: boolean }) => accessApi.updateRole(v.id, v), t('access.saved'), KEYS),
    deleteRole: useToastMutation((id: string) => accessApi.deleteRole(id), t('access.deleted'), KEYS),
    createTeam: useToastMutation((name: string) => accessApi.createTeam(name), t('teams.created'), KEYS),
    renameTeam: useToastMutation((v: { id: string; name: string }) => accessApi.renameTeam(v.id, v.name), t('teams.renamed'), KEYS),
    deleteTeam: useToastMutation((id: string) => accessApi.deleteTeam(id), t('teams.deleted'), KEYS),
  }
}

export type AccessActions = ReturnType<typeof useAccessConfig>
