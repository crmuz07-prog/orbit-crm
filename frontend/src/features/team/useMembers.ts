import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthProvider'
import { useAccess } from '@/hooks/useAccess'
import { teamApi } from '@/lib/api'
import type { Module, TeamMember } from '@/lib/types'

/** Workspace members (shares the Settings → Team query). */
export function useMembers() {
  const members = useQuery({ queryKey: ['team'], queryFn: teamApi.get }).data?.members ?? []
  return { members, memberById: new Map(members.map((m) => [m.user_id, m])) }
}

/** Who the caller may assign a record of `module` to — the same own/team/all rule the API applies. */
export function useAssignableOwners(module: Module): { owners: TeamMember[]; allowUnassigned: boolean } {
  const { session } = useAuth()
  const { scope } = useAccess()
  const { members } = useMembers()
  const me = members.find((m) => m.user_id === session?.user.id)
  const range = scope(module)
  if (range === 'all') return { owners: members, allowUnassigned: true }
  if (range === 'team' && me?.team_id) return { owners: members.filter((m) => m.team_id === me.team_id), allowUnassigned: true }
  return { owners: me ? [me] : [], allowUnassigned: range === 'team' }
}
