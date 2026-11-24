import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { chipFields, useCustomFields, valueList } from '@/features/fields/useFields'
import { useMembers } from '@/features/team/useMembers'
import { useNextTasks } from '@/hooks/useNextTasks'
import type { Deal } from '@/lib/types'

const UNASSIGNED = '__unassigned__'
const TASKS = ['overdue', 'today', 'none'] as const
// "fieldKey\u0000value": one select for every list value of every field (amoCRM quick filters).
const SEP = '\u0000'

/** Manager, next-task and field-value filters for the deals board and list. */
export function useDealFilters() {
  const { t } = useTranslation()
  const { members } = useMembers()
  const fields = useCustomFields()
  const nextTask = useNextTasks()
  const [owner, setOwner] = useState('')
  const [task, setTask] = useState('')
  const [value, setValue] = useState('')

  const valueOptions = useMemo(
    () => chipFields(fields).flatMap((f) => f.options.map((o) => ({ value: `${f.key}${SEP}${o}`, label: `${f.label}: ${o}` }))),
    [fields],
  )
  const apply = (deal: Deal) => {
    if (owner && (owner === UNASSIGNED ? deal.owner_id : deal.owner_id !== owner)) return false
    if (task && nextTask(deal.id).state !== task) return false
    if (value) {
      const [key, wanted] = value.split(SEP)
      if (!valueList(deal.custom?.[key]).includes(wanted)) return false
    }
    return true
  }

  const controls = (
    <>
      <SelectBox value={owner} onChange={setOwner} emptyLabel={t('owner.all')} className="w-40"
        options={[...members.map((m) => ({ value: m.user_id, label: m.full_name })), { value: UNASSIGNED, label: t('owner.unassigned') }]} />
      <SelectBox value={task} onChange={setTask} emptyLabel={t('tasks.filter')} className="w-40"
        options={TASKS.map((s) => ({ value: s, label: t(s === 'none' ? 'tasks.noTask' : `tasks.${s}`) }))} />
      {valueOptions.length > 0 && <SelectBox value={value} onChange={setValue} emptyLabel={t('deals.allValues')} options={valueOptions} className="w-48" />}
    </>
  )
  return { apply, controls, active: Boolean(owner || task || value) }
}
