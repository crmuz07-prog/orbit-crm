import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonAvatar } from '@/components/common/avatars'
import { Badge } from '@/components/ui/badge'
import { useLabels } from '@/hooks/useLabels'
import type { AccessOverview, Role, TeamMember } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MemberDialog } from './MemberDialog'
import type { TeamActions } from './useTeam'

interface Props {
  member: TeamMember
  isSelf: boolean
  canManage: boolean
  actorRole: Role
  actions: Pick<TeamActions, 'update' | 'remove' | 'setPassword'>
  /** Roles and teams of the workspace; loaded for admins only. */
  access?: AccessOverview
}

/** "Administrator" / "Member · Sales rep · North team": what the person can do, in one muted line. */
function useAccessSummary(member: TeamMember, access?: AccessOverview): string {
  const { t } = useTranslation()
  const labels = useLabels()
  const role = t(`roles.${member.role}`)
  if (member.role !== 'member' || !access) return role
  const accessRole = access.roles.find((r) => r.id === member.access_role_id) ?? access.roles.find((r) => r.is_default)
  const team = access.teams.find((x) => x.id === member.team_id)?.name ?? t('access.noTeam')
  return [role, accessRole && labels.role(accessRole.name), team].filter(Boolean).join(' · ')
}

/** One person as a calm line; whoever may manage them opens the member dialog (owners can't be edited by admins). */
export function MemberRow({ member, isSelf, canManage, actorRole, actions, access }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const editable = canManage && !isSelf && (member.role !== 'owner' || actorRole === 'owner')
  const summary = useAccessSummary(member, access)
  const body = (
    <>
      <PersonAvatar name={member.full_name} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-medium">{member.full_name}</span>
          {isSelf && <span className="text-xs text-muted-foreground">({t('team.you')})</span>}
          {member.must_change_password && <Badge tone="amber">{t('team.temporary')}</Badge>}
          {!member.is_active && <Badge tone="red">{t('team.inactive')}</Badge>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
      </span>
      <span className="hidden max-w-[45%] truncate text-right text-xs text-muted-foreground sm:block">{summary}</span>
    </>
  )
  return (
    <li>
      {editable ? (
        <button type="button" onClick={() => setOpen(true)} title={t('setup.members.edit')}
          className={cn('group flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] focus-visible:outline-none')}>
          {body}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2">{body}<span className="w-4 shrink-0" /></div>
      )}
      {/* On phones the summary sits under the name instead of beside it. */}
      <p className="-mt-1 truncate px-4 pb-2 pl-14 text-xs text-muted-foreground sm:hidden">{summary}</p>
      {open && <MemberDialog open onOpenChange={setOpen} member={member} actorRole={actorRole} actions={actions} access={access} />}
    </li>
  )
}
