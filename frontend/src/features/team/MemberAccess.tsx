import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { useLabels } from '@/hooks/useLabels'
import type { AccessOverview, TeamMember } from '@/lib/types'
import type { TeamActions } from './useTeam'
import { useMemberChange } from './useMemberChange'

interface Props {
  member: TeamMember
  config: AccessOverview
  update: TeamActions['update']
}

/** The member's access role (what they see and may do); owners and admins have full access and get none. */
export function AccessRoleSelect({ member, config, update }: Props) {
  const { t } = useTranslation()
  const labels = useLabels()
  const change = useMemberChange(member, update)
  const defaultRole = config.roles.find((r) => r.is_default)
  const roleName = (id: string) => labels.role(config.roles.find((r) => r.id === id)?.name ?? '')
  return (
    <SelectBox className="h-8 w-56" ariaLabel={t('setup.members.access')} value={member.access_role_id ?? defaultRole?.id ?? ''}
      onChange={(id) => change({ access_role_id: id || null }, t('confirm.member.accessRole'), roleName(id))}
      options={config.roles.map((r) => ({ value: r.id, label: labels.role(r.name) }))} />
  )
}

/** The member's sales team (team leads see their team's records). */
export function TeamSelect({ member, config, update }: Props) {
  const { t } = useTranslation()
  const change = useMemberChange(member, update)
  const teamName = (id: string) => config.teams.find((team) => team.id === id)?.name ?? t('access.noTeam')
  return (
    <SelectBox className="h-8 w-56" ariaLabel={t('setup.members.team')} value={member.team_id ?? ''} emptyLabel={t('access.noTeam')}
      onChange={(id) => change({ team_id: id || null }, t('confirm.member.team'), teamName(id))}
      options={config.teams.map((team) => ({ value: team.id, label: team.name }))} />
  )
}
