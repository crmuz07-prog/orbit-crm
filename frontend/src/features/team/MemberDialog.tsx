import { useState } from 'react'
import { UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonAvatar } from '@/components/common/avatars'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { SettingRow } from '@/components/common/setting-row'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { AccessOverview, Role, TeamMember } from '@/lib/types'
import { AccessRoleSelect, TeamSelect } from './MemberAccess'
import { SetPasswordButton } from './MemberPassword'
import { RoleSelect } from './RoleSelect'
import type { TeamActions } from './useTeam'
import { useMemberChange } from './useMemberChange'

interface Props {
  member: TeamMember
  actorRole: Role
  actions: Pick<TeamActions, 'update' | 'remove' | 'setPassword'>
  access?: AccessOverview
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Everything about one member in one place — system role, access, team, password, removal — each row explained. */
export function MemberDialog({ member, actorRole, actions, access, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const change = useMemberChange(member, actions.update)
  const [removing, setRemoving] = useState(false)
  const isMember = member.role === 'member'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <div className="flex items-center gap-3 px-4 py-3 pr-10">
          <PersonAvatar name={member.full_name} size="md" />
          <div className="min-w-0">
            <DialogTitle className="truncate">{member.full_name}</DialogTitle>
            <DialogDescription className="truncate">{member.email}</DialogDescription>
          </div>
        </div>
        <SettingRow label={t('setup.members.role')} hint={t('setup.members.roleHint')}>
          <RoleSelect value={member.role} actorRole={actorRole} className="h-8 w-56" ariaLabel={t('setup.members.role')}
            onChange={(role) => change({ role }, t('team.role'), t(`roles.${role}`))} />
        </SettingRow>
        {access && (
          <SettingRow label={t('setup.members.access')} hint={isMember ? t('setup.members.accessHint') : t('setup.members.fullAccessHint')}>
            {isMember ? <AccessRoleSelect member={member} config={access} update={actions.update} /> : <Badge tone="violet">{t('setup.members.fullAccess')}</Badge>}
          </SettingRow>
        )}
        {access && isMember && (
          <SettingRow label={t('setup.members.team')} hint={t('setup.members.teamHint')}>
            <TeamSelect member={member} config={access} update={actions.update} />
          </SettingRow>
        )}
        <SettingRow label={t('account.security')} hint={t('setup.members.passwordHint')}>
          <SetPasswordButton member={member} setPassword={actions.setPassword} />
        </SettingRow>
        <SettingRow label={t('team.remove')} hint={t('team.removeConfirmDesc')}>
          <Button variant="destructive" size="sm" onClick={() => setRemoving(true)}><UserMinus /> {t('team.remove')}</Button>
        </SettingRow>
        <ConfirmDialog open={removing} onOpenChange={setRemoving} title={t('team.removeConfirm', { name: member.full_name })} description={t('team.removeConfirmDesc')}
          confirmLabel={t('team.remove')} onConfirm={() => actions.remove.mutate(member.user_id, { onSuccess: () => onOpenChange(false) })} />
      </DialogContent>
    </Dialog>
  )
}
