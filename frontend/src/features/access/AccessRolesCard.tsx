import { useState } from 'react'
import { Pencil, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLabels } from '@/hooks/useLabels'
import { MODULES, type AccessRole } from '@/lib/types'
import { RoleDialog } from './RoleDialog'
import type { AccessActions } from './useAccessConfig'
import { IconButton } from '@/components/common/icon-button'

/** One chip per visible section: "Deals · Own". */
function Summary({ role }: { role: AccessRole }) {
  const { t } = useTranslation()
  const visible = MODULES.filter((m) => role.permissions[m].view)
  if (visible.length === 0) return <p className="text-xs text-muted-foreground">—</p>
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {visible.map((m) => (
        <span key={m} className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {t(`access.modules.${m}`)} · {t(`access.scopes.${role.permissions[m].scope}`)}
        </span>
      ))}
    </div>
  )
}

function RoleRow({ role, onEdit, onDelete, actions }: { role: AccessRole; onEdit: () => void; onDelete: () => void; actions: AccessActions }) {
  const { t } = useTranslation()
  const labels = useLabels()
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {labels.role(role.name)} {role.is_default && <Badge tone="violet">{t('access.default')}</Badge>}
          <span className="text-xs font-normal text-muted-foreground">{t('access.members', { count: role.member_count })}</span>
        </p>
        <Summary role={role} />
      </div>
      {!role.is_default && (
        <IconButton label={t('access.makeDefault')} onClick={() => actions.updateRole.mutate({ id: role.id, is_default: true })}><Star /></IconButton>
      )}
      <IconButton label={t('access.editRole')} onClick={onEdit}><Pencil /></IconButton>
      {!role.is_default && (
        <IconButton label={t('common.delete')} onClick={onDelete}><Trash2 /></IconButton>
      )}
    </li>
  )
}

/** Settings → Roles & access: permission sets for members (owners and admins always have full access). */
export function AccessRolesCard({ actions }: { actions: AccessActions }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<AccessRole | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<AccessRole | null>(null)
  if (!actions.config) return <Skeleton className="h-64 rounded-2xl" />

  return (
    <Card>
      <CardHeader title={t('access.title')} description={t('access.description')}
        action={<Button size="sm" onClick={() => setCreating(true)}><Plus /> {t('access.newRole')}</Button>} />
      <ul className="divide-y divide-foreground/[0.06]">
        {actions.config.roles.map((r) => (
          <RoleRow key={r.id} role={r} actions={actions} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />
        ))}
      </ul>
      <RoleDialog open={creating || !!editing} role={editing} actions={actions} onClose={() => { setCreating(false); setEditing(null) }} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={t('access.deleteConfirm', { name: deleting?.name })}
        description={t('access.deleteDesc')} confirmLabel={t('common.delete')} onConfirm={() => deleting && actions.deleteRole.mutate(deleting.id)} />
    </Card>
  )
}
