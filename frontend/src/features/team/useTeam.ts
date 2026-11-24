import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToastMutation } from '@/hooks/useToastMutation'
import { teamApi } from '@/lib/api'
import type { MemberPatch, NewLogin, Role } from '@/lib/types'

// Role and team changes alter the member counts shown in Roles & access.
const KEYS = [['team'], ['access']]

export function useTeam() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['team'], queryFn: teamApi.get })
  return {
    team: query.data,
    add: useToastMutation((v: NewLogin & { role: Role }) => teamApi.add(v), t('team.added'), KEYS),
    update: useToastMutation((v: { userId: string; patch: MemberPatch }) => teamApi.update(v.userId, v.patch), t('team.roleChanged'), KEYS),
    remove: useToastMutation((userId: string) => teamApi.remove(userId), t('team.removed'), KEYS),
    setPassword: useToastMutation((v: { userId: string; password: string }) => teamApi.setPassword(v.userId, v.password), t('team.passwordSet'), KEYS),
  }
}

export type TeamActions = Omit<ReturnType<typeof useTeam>, 'team'>
