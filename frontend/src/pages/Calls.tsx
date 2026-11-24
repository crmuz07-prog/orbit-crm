import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { SelectBox } from '@/components/common/form-fields'
import { MotionList } from '@/components/common/motion-list'
import { Page } from '@/components/common/page'
import { CreateButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageSkeleton } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { ActivityMeta } from '@/features/activities/ActivityLinks'
import { ActivityRow } from '@/features/activities/ActivityRow'
import { CallStatsStrip } from '@/features/calls/CallStatsStrip'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { CALL_DIRECTIONS, CALL_OUTCOMES } from '@/lib/constants'
import { fullName, toDate } from '@/lib/utils'

/** Call log (Aircall / Close "Calls" view): KPIs, filters and every logged conversation. */
export default function CallsPage() {
  const { t } = useTranslation()
  const { isLoading, activities, contactById } = useCrm()
  const openModal = useEntityModal()
  const [query, setQuery] = useState('')
  const [outcome, setOutcome] = useState('')
  const [direction, setDirection] = useState('')

  const calls = useMemo(
    () =>
      activities
        .filter((a) => a.type === 'call' && a.done)
        .filter((a) => (!outcome || a.call_outcome === outcome) && (!direction || a.call_direction === direction))
        .filter((a) => {
          const contact = a.contact_id ? contactById.get(a.contact_id) : undefined
          return matches(query, a.subject, a.body, a.next_steps, contact && fullName(contact))
        })
        .sort((a, b) => toDate(b.due_at ?? b.created_at).getTime() - toDate(a.due_at ?? a.created_at).getTime()),
    [activities, outcome, direction, query, contactById],
  )

  if (isLoading) return <PageSkeleton />

  const logCall = <CreateButton module="activities" variant="success" onClick={() => openModal({ kind: 'call' })}><Phone /> {t('calls.logCall')}</CreateButton>

  return (
    <Page title={t('calls.title')} description={t('calls.description')} actions={logCall}>
      <CallStatsStrip />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('nav.search')} />
        <SelectBox value={outcome} onChange={setOutcome} emptyLabel={t('calls.allOutcomes')} options={CALL_OUTCOMES.map((o) => ({ value: o.value, label: t(`enums.outcome.${o.value}`) }))} className="w-44" />
        <SelectBox value={direction} onChange={setDirection} emptyLabel={t('calls.allDirections')} options={CALL_DIRECTIONS.map((d) => ({ value: d, label: t(`enums.direction.${d}`) }))} className="w-44" />
      </div>
      <Card>
        {calls.length === 0 ? (
          <EmptyState icon={Phone} title={t('calls.empty')} description={t('calls.emptyDesc')} action={logCall} />
        ) : (
          <MotionList key={outcome + direction} items={calls} className="divide-y divide-foreground/[0.06]" render={(a) => <ActivityRow activity={a} meta={<ActivityMeta activity={a} />} />} />
        )}
      </Card>
    </Page>
  )
}
