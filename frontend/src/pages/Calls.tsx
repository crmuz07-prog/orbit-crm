import { useMemo, useState } from 'react'
import { isToday, isYesterday } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { FilterChips } from '@/components/common/filter-chips'
import { MotionList } from '@/components/common/motion-list'
import { Page } from '@/components/common/page'
import { CreateButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { needsSummary } from '@/features/calls/CallDetails'
import { CallRow } from '@/features/calls/CallRow'
import { CallStatsStrip } from '@/features/calls/CallStatsStrip'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { Activity } from '@/lib/types'
import { fullName, shortDate, toDate } from '@/lib/utils'

const FILTERS = ['all', 'connected', 'missed', 'summary', 'inbound', 'outbound'] as const
type Filter = (typeof FILTERS)[number]

const passes = (filter: Filter) => (a: Activity) => {
  if (filter === 'connected') return a.call_outcome === 'connected'
  if (filter === 'missed') return !!a.call_outcome && a.call_outcome !== 'connected'
  if (filter === 'summary') return needsSummary(a)
  if (filter === 'inbound' || filter === 'outbound') return a.call_direction === filter
  return true
}

/** "Today", "Yesterday", or the date — the day headers of the call log. */
function dayLabel(date: Date, t: (key: 'feed.today' | 'feed.yesterday') => string) {
  return isToday(date) ? t('feed.today') : isYesterday(date) ? t('feed.yesterday') : shortDate(date.toISOString())
}

/** Call log (Aircall / Close "Calls" view): KPIs, one-tap filters with counts, the calls by day — one line each. */
export default function CallsPage() {
  const { t } = useTranslation()
  const { isLoading, activities, contactById } = useCrm()
  const openModal = useEntityModal()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = usePersistentState<Filter>('orbit:calls-filter', 'all', FILTERS)

  const searched = useMemo(
    () => activities
      .filter((a) => a.type === 'call' && a.done)
      .filter((a) => {
        const contact = a.contact_id ? contactById.get(a.contact_id) : undefined
        return matches(query, a.subject, a.body, a.next_steps, a.phone, contact && fullName(contact))
      })
      .sort((a, b) => toDate(b.due_at ?? b.created_at).getTime() - toDate(a.due_at ?? a.created_at).getTime()),
    [activities, query, contactById],
  )
  const counts = Object.fromEntries(FILTERS.map((f) => [f, searched.filter(passes(f)).length])) as Record<Filter, number>
  const calls = searched.filter(passes(filter))
  const days = calls.reduce<{ key: string; label: string; rows: Activity[] }[]>((groups, call) => {
    const at = toDate(call.due_at ?? call.created_at)
    const key = at.toDateString()
    const last = groups.at(-1)
    if (last?.key === key) last.rows.push(call)
    else groups.push({ key, label: dayLabel(at, t), rows: [call] })
    return groups
  }, [])

  if (isLoading) return <PageLoading title={t('calls.title')} description={t('calls.description')} />

  const logCall = <CreateButton module="activities" variant="success" onClick={() => openModal({ kind: 'call' })}><Phone /> {t('calls.logCall')}</CreateButton>

  return (
    <Page title={t('calls.title')} description={t('calls.description')} actions={logCall}>
      <CallStatsStrip />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('calls.list.search')} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} counts={counts} label={(f) => t(`calls.list.${f}`)} alert="summary" />
      </div>
      <Card>
        {calls.length === 0 ? (
          <EmptyState icon={Phone} title={t('calls.empty')} description={t('calls.emptyDesc')} action={logCall} />
        ) : days.map((day) => (
          <section key={day.key}>
            <h3 className="border-b border-foreground/[0.06] bg-foreground/[0.02] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {day.label} · {day.rows.length}
            </h3>
            <MotionList items={day.rows} className="divide-y divide-foreground/[0.06]" render={(a) => <CallRow call={a} />} />
          </section>
        ))}
      </Card>
    </Page>
  )
}
