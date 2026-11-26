import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { useLabels } from '@/hooks/useLabels'
import type { AccessOverview, TeamMember } from '@/lib/types'
import type { TeamActions } from './useTeam'
import { useMemberChange } from './useMemberChange'

/** Access role + sales team pickers for a member (owners and admins have full access, so they get none). */
export function MemberAccess({ member, config, update }: { member: TeamMember; config: AccessOverview; update: TeamActions['update'] }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const change = useMemberChange(member, update)
  const defaultRole = config.roles.find((r) => r.is_default)
  const roleName = (id: string) => labels.role(config.roles.find((r) => r.id === id)?.name ?? '')
  const teamName = (id: string) => config.teams.find((team) => team.id === id)?.name ?? t('access.noTeam')
  return (
    <>
      <SelectBox className="h-8 w-[150px]" ariaLabel={t('setup.members.access')} value={member.access_role_id ?? defaultRole?.id ?? ''} onChange={(id) => change({ access_role_id: id || null }, t('confirm.member.accessRole'), roleName(id))}
        options={config.roles.map((r) => ({ value: r.id, label: labels.role(r.name) }))} />
      <SelectBox className="h-8 w-[140px]" ariaLabel={t('setup.members.team')} value={member.team_id ?? ''} emptyLabel={t('access.noTeam')} onChange={(id) => change({ team_id: id || null }, t('confirm.member.team'), teamName(id))}
        options={config.teams.map((team) => ({ value: team.id, label: team.name }))} />
    </>
  )
}
