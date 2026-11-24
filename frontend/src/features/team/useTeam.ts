import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { teamApi } from '@/lib/api'
import type { NewLogin, Role } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

const KEY = ['team']

/** A team mutation: refetches the team and confirms with a toast. */
function useTeamMutation<A, R>(fn: (arg: A) => Promise<R>, success: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success)
      return qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}

export function useTeam() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: KEY, queryFn: teamApi.get })
  return {
    team: query.data,
    add: useTeamMutation((v: NewLogin & { role: Role }) => teamApi.add(v), t('team.added')),
    changeRole: useTeamMutation((v: { userId: string; role: Role }) => teamApi.changeRole(v.userId, v.role), t('team.roleChanged')),
    remove: useTeamMutation((userId: string) => teamApi.remove(userId), t('team.removed')),
    setPassword: useTeamMutation((v: { userId: string; password: string }) => teamApi.setPassword(v.userId, v.password), t('team.passwordSet')),
  }
}

export type TeamActions = Omit<ReturnType<typeof useTeam>, 'team'>
