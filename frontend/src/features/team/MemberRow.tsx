import { useState, type FormEvent } from 'react'
import { KeyRound, UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonAvatar } from '@/components/common/avatars'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CredentialsCard } from '@/components/common/credentials-card'
import { PasswordField, generatePassword } from '@/components/common/password-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import type { AccessOverview, Role, TeamMember } from '@/lib/types'
import { MemberAccess } from './MemberAccess'
import { RoleSelect } from './RoleSelect'
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

/** Admin issues a temporary password; the member must replace it at the next sign-in. */
function SetPasswordButton({ member, setPassword }: { member: TeamMember; setPassword: TeamActions['setPassword'] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [password, setValue] = useState('')
  const [issued, setIssued] = useState<string | null>(null)

  const show = () => {
    setValue(generatePassword())
    setIssued(null)
    setOpen(true)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setPassword.mutate({ userId: member.user_id, password }, { onSuccess: () => setIssued(password) })
  }

  return (
    <>
      <Tooltip content={t('team.setPassword')}>
        <Button variant="ghost" size="icon" onClick={show} aria-label={t('team.setPassword')}><KeyRound /></Button>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('team.setPassword')}</DialogTitle>
            <DialogDescription>{t('team.setPasswordHint', { name: member.full_name })}</DialogDescription>
          </DialogHeader>
          {issued ? <CredentialsCard email={member.email} password={issued} /> : (
            <form onSubmit={submit} className="space-y-4">
              <PasswordField label={t('team.tempPassword')} value={password} onChange={setValue} />
              <div className="flex justify-end"><Button type="submit" disabled={setPassword.isPending}>{t('team.setPassword')}</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** One person in Settings → Team; owners can't be edited by admins (mirrors the API). */
export function MemberRow({ member, isSelf, canManage, actorRole, actions, access }: Props) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const editable = canManage && !isSelf && (member.role !== 'owner' || actorRole === 'owner')

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <PersonAvatar name={member.full_name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {member.full_name} {isSelf && <span className="text-muted-foreground">({t('team.you')})</span>}
        </p>
        <p className="flex flex-wrap items-center gap-1 truncate text-xs text-muted-foreground">
          {member.email}
          {member.must_change_password && <Badge tone="amber">{t('team.temporary')}</Badge>}
          {!member.is_active && <Badge tone="red">{t('team.inactive')}</Badge>}
        </p>
      </div>
      {editable ? (
        <RoleSelect value={member.role} actorRole={actorRole} className="w-40" onChange={(role) => actions.update.mutate({ userId: member.user_id, patch: { role } })} />
      ) : (
        <Badge tone={member.role === 'owner' ? 'violet' : member.role === 'admin' ? 'blue' : 'gray'}>{t(`roles.${member.role}`)}</Badge>
      )}
      {canManage && access && member.role === 'member' && <MemberAccess member={member} config={access} update={actions.update} />}
      {editable && (
        <div className="flex gap-0.5">
          <SetPasswordButton member={member} setPassword={actions.setPassword} />
          <Tooltip content={t('team.remove')}>
            <Button variant="ghost" size="icon" onClick={() => setConfirm(true)} aria-label={t('team.remove')}><UserMinus /></Button>
          </Tooltip>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('team.removeConfirm', { name: member.full_name })}
        description={t('team.removeConfirmDesc')}
        confirmLabel={t('team.remove')}
        onConfirm={() => actions.remove.mutate(member.user_id)}
      />
    </li>
  )
}
