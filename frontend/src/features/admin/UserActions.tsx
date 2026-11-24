import { useState } from 'react'
import { Building2, KeyRound, MoreHorizontal, Power, ShieldCheck, UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { AdminUser } from '@/lib/types'
import type { AdminActions } from './useAdmin'

type Pending = { title: string; description: string; label: string; run: () => void }

interface Props {
  user: AdminUser
  isSelf: boolean
  actions: AdminActions
  onSetPassword: (u: AdminUser) => void
  onAddToCompany: (u: AdminUser) => void
}

/** Row menu in Admin → Users; destructive steps (deactivate, remove from company) are confirmed. */
export function UserActions({ user, isSelf, actions, onSetPassword, onAddToCompany }: Props) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<Pending | null>(null)
  const update = (patch: Partial<Pick<AdminUser, 'is_active' | 'is_superadmin'>>) => actions.updateUser.mutate({ id: user.id, patch })

  const deactivate = () => setPending({ title: `${t('admin.deactivate')}: ${user.full_name}`, description: t('errors.account_disabled'), label: t('admin.deactivate'), run: () => update({ is_active: false }) })
  const removeFrom = (workspaceId: string, name: string) => setPending({
    title: t('admin.removeFromCompany', { company: name }), description: t('team.removeConfirmDesc'), label: t('team.remove'),
    run: () => actions.removeMembership.mutate({ id: user.id, workspaceId }),
  })

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
            : <DropdownMenuItem onSelect={() => update({ is_active: true })}><Power /> {t('admin.activate')}</DropdownMenuItem>)}
          {!isSelf && (
            <DropdownMenuItem onSelect={() => update({ is_superadmin: !user.is_superadmin })}>
              <ShieldCheck /> {user.is_superadmin ? t('admin.removeSuperadmin') : t('admin.makeSuperadmin')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)} title={pending?.title ?? ''} description={pending?.description ?? ''}
        confirmLabel={pending?.label} onConfirm={() => pending?.run()} />
    </>
  )
}
