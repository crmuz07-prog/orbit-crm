import { useState, type FormEvent } from 'react'
import { KeyRound, UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonAvatar } from '@/components/common/avatars'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CredentialsCard } from '@/components/common/credentials-card'
import { PasswordField, generatePassword } from '@/components/common/password-field'
import { useFormErrors } from '@/hooks/useFormErrors'
import { useMemberChange } from './useMemberChange'
import { newPassword } from '@/lib/validation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AccessOverview, Role, TeamMember } from '@/lib/types'
import { MemberAccess } from './MemberAccess'
import { RoleSelect } from './RoleSelect'
import type { TeamActions } from './useTeam'
import { IconButton } from '@/components/common/icon-button'
import { cn } from '@/lib/utils'

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
  const errors = useFormErrors<'password'>('member-password-form')

  const show = () => {
    setValue(generatePassword())
    setIssued(null)
    setOpen(true)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ password }, { password: newPassword() })) return
    setPassword.mutate({ userId: member.user_id, password }, { onSuccess: () => setIssued(password), onError: (err) => errors.fromApi(err) })
  }

  return (
    <>
      <IconButton label={t('team.setPassword')} onClick={show}><KeyRound /></IconButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('team.setPassword')}</DialogTitle>
            <DialogDescription>{t('team.setPasswordHint', { name: member.full_name })}</DialogDescription>
          </DialogHeader>
          {issued ? <CredentialsCard email={member.email} password={issued} /> : (
            <form id="member-password-form" onSubmit={submit} noValidate className="space-y-3">
              <PasswordField label={t('team.tempPassword')} value={password} onChange={errors.bind('password', setValue)} error={errors.message('password')} />
              <div className="flex justify-end"><Button type="submit" disabled={setPassword.isPending}>{t('team.setPassword')}</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Column widths shared by the member list header and its rows. */
export const MEMBER_GRID = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_150px_150px_140px_72px]'

/** One person in Settings → Team; owners can't be edited by admins (mirrors the API). */
export function MemberRow({ member, isSelf, canManage, actorRole, actions, access }: Props) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const editable = canManage && !isSelf && (member.role !== 'owner' || actorRole === 'owner')
  const change = useMemberChange(member, actions.update)

  return (
    <li className={cn(MEMBER_GRID, 'px-4 py-2')}>
      <div className="flex min-w-0 items-center gap-3">
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
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 pl-10 sm:contents">
        {editable ? (
          <RoleSelect value={member.role} actorRole={actorRole} className="h-8 w-[150px]" ariaLabel={t('setup.members.role')}
            onChange={(role) => change({ role }, t('team.role'), t(`roles.${role}`))} />
        ) : (
          <span><Badge tone={member.role === 'owner' ? 'violet' : member.role === 'admin' ? 'blue' : 'gray'}>{t(`roles.${member.role}`)}</Badge></span>
        )}
        {/* Owners and admins have full access, so there is nothing to pick for them. */}
        {canManage && access && member.role === 'member'
          ? <MemberAccess member={member} config={access} update={actions.update} />
          : <><span className="hidden text-xs text-muted-foreground sm:block">{member.role !== 'member' ? t('setup.members.fullAccess') : ''}</span><span className="hidden sm:block" /></>}
        <div className="ml-auto flex justify-end gap-0.5 sm:ml-0">
          {editable && <SetPasswordButton member={member} setPassword={actions.setPassword} />}
          {editable && <IconButton label={t('team.remove')} onClick={() => setConfirm(true)}><UserMinus /></IconButton>}
        </div>
      </div>
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
