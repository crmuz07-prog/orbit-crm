import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { useLabels } from '@/hooks/useLabels'
import type { AccessOverview, TeamMember } from '@/lib/types'
import type { TeamActions } from './useTeam'

/** Access role + sales team pickers for a member (owners and admins have full access, so they get none). */
export function MemberAccess({ member, config, update }: { member: TeamMember; config: AccessOverview; update: TeamActions['update'] }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const save = (patch: Partial<TeamMember>) => update.mutate({ userId: member.user_id, patch })
  const defaultRole = config.roles.find((r) => r.is_default)
  return (
    <div className="flex w-full flex-wrap gap-2 pl-12 sm:w-auto sm:pl-0">
      <SelectBox className="h-8 w-40" value={member.access_role_id ?? defaultRole?.id ?? ''} onChange={(id) => save({ access_role_id: id || null })}
        options={config.roles.map((r) => ({ value: r.id, label: labels.role(r.name) }))} />
      <SelectBox className="h-8 w-36" value={member.team_id ?? ''} emptyLabel={t('access.noTeam')} onChange={(id) => save({ team_id: id || null })}
        options={config.teams.map((team) => ({ value: team.id, label: team.name }))} />
    </div>
  )
}
