import { Building2, KeyRound, MoreHorizontal, Power, ShieldCheck, UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConfirm, type ConfirmOptions } from '@/components/common/confirm-provider'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { AdminUser } from '@/lib/types'
import type { AdminActions } from './useAdmin'

interface Props {
  user: AdminUser
  isSelf: boolean
  actions: AdminActions
  onSetPassword: (u: AdminUser) => void
  onAddToCompany: (u: AdminUser) => void
}

/** Row menu in Admin → Users; every account-level change (deactivate, reactivate, rights, memberships) is confirmed. */
export function UserActions({ user, isSelf, actions, onSetPassword, onAddToCompany }: Props) {
  const { t } = useTranslation()
  const confirm = useConfirm()
  const update = (patch: Partial<Pick<AdminUser, 'is_active' | 'is_superadmin'>>) => actions.updateUser.mutate({ id: user.id, patch })
  const ask = async (options: ConfirmOptions, run: () => void) => { if (await confirm(options)) run() }
  const name = { name: user.full_name }

  const deactivate = () => ask({ title: `${t('admin.deactivate')}: ${user.full_name}`, description: t('errors.account_disabled'), confirmLabel: t('admin.deactivate') }, () => update({ is_active: false }))
  const activate = () => ask({ title: t('confirm.activate.title', name), description: t('confirm.activate.desc'), confirmLabel: t('confirm.activate.action'), tone: 'default' }, () => update({ is_active: true }))
  const superadmin = () => {
    const kind = user.is_superadmin ? 'revoke' : 'grant'
    void ask({ title: t(`confirm.${kind}.title`, name), description: t(`confirm.${kind}.desc`), confirmLabel: t(`confirm.${kind}.action`), tone: kind === 'grant' ? 'default' : 'danger' },
      () => update({ is_superadmin: !user.is_superadmin }))
  }
  const removeFrom = (workspaceId: string, company: string) => ask(
    { title: t('admin.removeFromCompany', { company }), description: t('team.removeConfirmDesc'), confirmLabel: t('team.remove') },
    () => actions.removeMembership.mutate({ id: user.id, workspaceId }),
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t('admin.actions')}><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => onSetPassword(user)}><KeyRound /> {t('team.setPassword')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAddToCompany(user)}><Building2 /> {t('admin.addToCompany')}</DropdownMenuItem>
          {user.memberships.map((m) => (
            <DropdownMenuItem key={m.workspace_id} onSelect={() => removeFrom(m.workspace_id, m.workspace_name)}><UserMinus /> {t('admin.removeFromCompany', { company: m.workspace_name })}</DropdownMenuItem>
          ))}
          {!isSelf && <DropdownMenuSeparator />}
          {!isSelf && (user.is_active
            ? <DropdownMenuItem onSelect={deactivate} className="text-rose-600 dark:text-rose-400"><Power /> {t('admin.deactivate')}</DropdownMenuItem>
            : <DropdownMenuItem onSelect={activate}><Power /> {t('admin.activate')}</DropdownMenuItem>)}
          {!isSelf && (
            <DropdownMenuItem onSelect={superadmin}>
              <ShieldCheck /> {user.is_superadmin ? t('admin.removeSuperadmin') : t('admin.makeSuperadmin')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
