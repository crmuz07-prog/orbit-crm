import { useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import type { SalesTeam } from '@/lib/types'
import type { AccessActions } from './useAccessConfig'

/** One input + button form, used to add a team and to rename one in place. */
function NameForm({ initial, placeholder, label, onSubmit }: { initial: string; placeholder: string; label: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSubmit(name.trim())
    setName(initial)
  }
  return (
    <form onSubmit={submit} className="flex flex-1 gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={80} autoFocus={!!initial} />
      <Button type="submit" variant="outline" size="icon" aria-label={label} className="size-9 shrink-0">{initial ? <Check /> : <Plus />}</Button>
    </form>
  )
}

function TeamRow({ team, actions, onDelete }: { team: SalesTeam; actions: AccessActions; onDelete: () => void }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const rename = (name: string) => actions.renameTeam.mutate({ id: team.id, name }, { onSuccess: () => setEditing(false) })
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <Users className="size-4 shrink-0 text-muted-foreground" />
      {editing ? <NameForm initial={team.name} placeholder={t('teams.name')} label={t('common.save')} onSubmit={rename} /> : (
        <p className="flex-1 truncate text-sm">
          <span className="font-medium">{team.name}</span> <span className="text-xs text-muted-foreground">{t('access.members', { count: team.member_count })}</span>
        </p>
      )}
      {!editing && (
        <>
          <Tooltip content={t('admin.rename')}><Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label={t('admin.rename')}><Pencil /></Button></Tooltip>
          <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon" onClick={onDelete} aria-label={t('common.delete')}><Trash2 /></Button></Tooltip>
        </>
      )}
    </li>
  )
}

/** Settings → Sales teams: the groups that the "team" records scope works on. */
export function SalesTeamsCard({ actions }: { actions: AccessActions }) {
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState<SalesTeam | null>(null)
  const teams = actions.config?.teams ?? []
  return (
    <Card>
      <CardHeader title={t('teams.title')} description={t('teams.description')} />
      <CardContent className="border-b border-foreground/[0.06]">
        <NameForm initial="" placeholder={t('teams.name')} label={t('teams.add')} onSubmit={(name) => actions.createTeam.mutate(name)} />
      </CardContent>
      {teams.length === 0 ? <p className="px-5 py-4 text-sm text-muted-foreground">{t('teams.empty')}</p> : (
        <ul className="divide-y divide-foreground/[0.06]">
          {teams.map((team) => <TeamRow key={team.id} team={team} actions={actions} onDelete={() => setDeleting(team)} />)}
        </ul>
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={t('teams.deleteConfirm', { name: deleting?.name })}
        description={t('teams.deleteDesc')} confirmLabel={t('common.delete')} onConfirm={() => deleting && actions.deleteTeam.mutate(deleting.id)} />
    </Card>
  )
}
