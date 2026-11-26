import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FilterChips } from '@/components/common/filter-chips'
import { SelectBox } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { useMembers } from '@/features/team/useMembers'
import { useNextTasks, type RecordLink } from '@/hooks/useNextTasks'

const UNASSIGNED = '__unassigned__'
export const PEOPLE_PRESETS = ['all', 'overdue', 'today', 'noTask', 'withDeals', 'noDeals'] as const
type Preset = (typeof PEOPLE_PRESETS)[number]

/**
 * amoCRM list filters shared by contacts and companies: the manager as a select, the next task and deals as one row of
 * chips with counts ("Task overdue 12", "No task 15") — instead of two more selects whose labels did not fit.
 */
export function usePeopleFilters<T extends { id: string; owner_id: string | null }>(link: RecordLink, openDeals: (row: T) => number, extra = 0) {
  const { t } = useTranslation()
  const { members } = useMembers()
  const nextTask = useNextTasks(link)
  const [owner, setOwner] = useState('')
  const [preset, setPreset] = useState<Preset>('all')
  const active = !!owner || preset !== 'all' || extra > 0

  const byOwner = (row: T) => !owner || (owner === UNASSIGNED ? !row.owner_id : row.owner_id === owner)
  const byPreset = (p: Preset) => (row: T) => {
    if (p === 'overdue' || p === 'today') return nextTask(row.id).state === p
    if (p === 'noTask') return nextTask(row.id).state === 'none'
    if (p === 'withDeals') return openDeals(row) > 0
    if (p === 'noDeals') return openDeals(row) === 0
    return true
  }
  const apply = (row: T) => byOwner(row) && byPreset(preset)(row)

  const reset = () => { setOwner(''); setPreset('all') }
  /** `rows`: the list before these filters (search and other filters applied) — the chips count within it. */
  const controls = (rows: T[], onReset?: () => void) => {
    const mine = rows.filter(byOwner)
    const counts = Object.fromEntries(PEOPLE_PRESETS.map((p) => [p, mine.filter(byPreset(p)).length])) as Record<Preset, number>
    return {
      owner: (
        <SelectBox value={owner} onChange={setOwner} emptyLabel={t('owner.all')} className="w-44"
          options={[...members.map((m) => ({ value: m.user_id, label: m.full_name })), { value: UNASSIGNED, label: t('owner.unassigned') }]} />
      ),
      reset: active && <Button variant="ghost" size="sm" onClick={() => { reset(); onReset?.() }}><X /> {t('people.reset')}</Button>,
      chips: <FilterChips options={PEOPLE_PRESETS} value={preset} onChange={setPreset} counts={counts} label={(p) => t(`people.presets.${p}`)} alert="overdue" />,
    }
  }
  return { apply, controls, nextTask }
}
