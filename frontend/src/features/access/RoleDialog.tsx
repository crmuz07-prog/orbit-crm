import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLabels } from '@/hooks/useLabels'
import { ACTIONS, MODULES, type AccessRole, type Permissions } from '@/lib/types'
import { PermissionMatrix } from './PermissionMatrix'
import type { AccessActions } from './useAccessConfig'

// A new role starts as "view own records" so nothing is granted by accident.
const START: Permissions = Object.fromEntries(
  MODULES.map((m) => [m, { ...Object.fromEntries(ACTIONS.map((a) => [a, a === 'view'])), scope: 'own' }]),
) as Permissions

function RoleForm({ role, actions, onDone }: { role: AccessRole | null; actions: AccessActions; onDone: () => void }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const shown = role ? labels.role(role.name) : ''
  const [name, setName] = useState(shown)
  const [permissions, setPermissions] = useState<Permissions>(role?.permissions ?? START)
  const busy = actions.createRole.isPending || actions.updateRole.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // An untouched built-in name keeps its stored (English) value, so it stays translatable.
    const values = { name: role && name.trim() === shown ? role.name : name.trim(), permissions }
    if (role) actions.updateRole.mutate({ id: role.id, ...values }, { onSuccess: onDone })
    else actions.createRole.mutate(values, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField label={t('access.roleName')} required autoFocus value={name} onChange={setName} />
      <PermissionMatrix value={permissions} onChange={setPermissions} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={busy}>{t('common.save')}</Button>
      </div>
    </form>
  )
}

/** `role` null + open → create; a role → edit. */
export function RoleDialog({ open, role, actions, onClose }: { open: boolean; role: AccessRole | null; actions: AccessActions; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{role ? t('access.editRole') : t('access.newRole')}</DialogTitle></DialogHeader>
        {open && <RoleForm key={role?.id ?? 'new'} role={role} actions={actions} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
