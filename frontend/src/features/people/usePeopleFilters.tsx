import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { useMembers } from '@/features/team/useMembers'
import { useNextTasks, type RecordLink } from '@/hooks/useNextTasks'

const UNASSIGNED = '__unassigned__'
const TASKS = ['overdue', 'today', 'none'] as const
const DEALS = ['open', 'none'] as const

/** amoCRM list filters shared by contacts and companies: manager, next task, deals. */
export function usePeopleFilters<T extends { id: string; owner_id: string | null }>(link: RecordLink, openDeals: (row: T) => number, extra = 0) {
  const { t } = useTranslation()
  const { members } = useMembers()
  const nextTask = useNextTasks(link)
  const [owner, setOwner] = useState('')
  const [task, setTask] = useState('')
  const [deals, setDeals] = useState('')
  const active = !!(owner || task || deals) || extra > 0

  const apply = (row: T) =>
    (!owner || (owner === UNASSIGNED ? !row.owner_id : row.owner_id === owner))
    && (!task || nextTask(row.id).state === task)
    && (!deals || (deals === 'open' ? openDeals(row) > 0 : openDeals(row) === 0))

  const reset = () => { setOwner(''); setTask(''); setDeals('') }
  const controls = (onReset?: () => void) => (
    <>
      <SelectBox value={owner} onChange={setOwner} emptyLabel={t('owner.all')} className="w-36"
        options={[...members.map((m) => ({ value: m.user_id, label: m.full_name })), { value: UNASSIGNED, label: t('owner.unassigned') }]} />
      <SelectBox value={task} onChange={setTask} emptyLabel={t('tasks.filter')} className="w-36"
        options={TASKS.map((s) => ({ value: s, label: t(s === 'none' ? 'tasks.noTask' : `tasks.${s}`) }))} />
      <SelectBox value={deals} onChange={setDeals} emptyLabel={t('people.allDeals')} className="w-36"
        options={DEALS.map((d) => ({ value: d, label: t(`people.deals.${d}`) }))} />
      {active && <Button variant="ghost" size="sm" onClick={() => { reset(); onReset?.() }}><X /> {t('people.reset')}</Button>}
    </>
  )
  return { apply, controls, nextTask }
}
