import { useMemo, useState } from 'react'
import { CalendarCheck, KanbanSquare, List, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Page } from '@/components/common/page'
import { CreateButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { TaskBoard } from '@/features/tasks/TaskBoard'
import { TaskList } from '@/features/tasks/TaskList'
import { TASK_PRESETS, TaskPresetChips, useTaskPreset, type TaskPreset } from '@/features/tasks/TaskPresets'
import { useMembers } from '@/features/team/useMembers'
import { useCrm } from '@/hooks/useData'
import { usePersistentState } from '@/hooks/usePersistentState'
import { ACTIVITY_TYPES } from '@/lib/constants'
import { isTask } from '@/lib/tasks'
import { fullName } from '@/lib/utils'

const VIEWS = ['list', 'board'] as const
const TYPES = ACTIVITY_TYPES.filter((v) => v !== 'note' && v !== 'message')

/** amoCRM "Задачи": what has to be done, by deadline — as a list or a board — closed with a result. */
export default function TasksPage() {
  const { t } = useTranslation()
  const { isLoading, activities, dealById, contactById } = useCrm()
  const { members } = useMembers()
  const openModal = useEntityModal()
  const [view, setView] = usePersistentState('orbit:tasks-view', 'list', VIEWS)
  const [preset, setPreset] = usePersistentState<TaskPreset>('orbit:tasks-preset', 'open', TASK_PRESETS)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [owner, setOwner] = useState('')
  const byPreset = useTaskPreset()

  const base = useMemo(() => activities.filter((a) => isTask(a) && (!type || a.type === type) && (!owner || a.owner_id === owner) && matches(query,
    a.subject, a.deal_id && dealById.get(a.deal_id)?.title, a.contact_id && contactById.get(a.contact_id) && fullName(contactById.get(a.contact_id)!))),
  [activities, type, owner, query, dealById, contactById])
  const counts = Object.fromEntries(TASK_PRESETS.map((p) => [p, base.filter(byPreset(p)).length])) as Record<TaskPreset, number>
  const tasks = base.filter(byPreset(preset))
  const newTask = <CreateButton module="activities" onClick={() => openModal({ kind: 'activity', initial: { type: 'task' } })}><Plus /> {t('activities.newActivity')}</CreateButton>

  if (isLoading) return <PageLoading title={t('activities.title')} />

  return (
    <Page title={t('activities.title')} description={t('activities.description')} actions={newTask}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('tasks.search')} />
        <SelectBox value={owner} onChange={setOwner} emptyLabel={t('owner.all')} options={members.map((m) => ({ value: m.user_id, label: m.full_name }))} className="w-40" />
        <SelectBox value={type} onChange={setType} emptyLabel={t('activities.allTypes')} options={TYPES.map((v) => ({ value: v, label: t(`enums.activity.${v}`) }))} className="w-36" />
        <Tabs value={view} onValueChange={(v) => setView(v as (typeof VIEWS)[number])} className="ml-auto">
          <TabsList>
            <Tooltip content={t('deals.list')}><TabsTrigger value="list" aria-label={t('deals.list')}><List /></TabsTrigger></Tooltip>
            <Tooltip content={t('deals.board')}><TabsTrigger value="board" aria-label={t('deals.board')}><KanbanSquare /></TabsTrigger></Tooltip>
          </TabsList>
        </Tabs>
      </div>
      <div className="mb-3"><TaskPresetChips value={preset} onChange={setPreset} counts={counts} /></div>
      {view === 'board' && preset !== 'done' ? <TaskBoard tasks={tasks} /> : (
        <Card>
          {tasks.length === 0
            ? <EmptyState icon={CalendarCheck} title={preset === 'overdue' ? t('activities.emptyOverdue') : t('activities.empty')} description={t('activities.emptyDesc')} action={newTask} />
            : <TaskList tasks={tasks} grouped={preset !== 'done'} />}
        </Card>
      )}
    </Page>
  )
}
