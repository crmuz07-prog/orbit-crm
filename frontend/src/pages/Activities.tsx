import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarCheck, Plus } from 'lucide-react'
import { SelectBox } from '@/components/common/form-fields'
import { MotionList } from '@/components/common/motion-list'
import { Page } from '@/components/common/page'
import { CreateButton } from '@/components/common/record-actions'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityMeta } from '@/features/activities/ActivityLinks'
import { ActivityRow } from '@/features/activities/ActivityRow'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useMembers } from '@/features/team/useMembers'
import { useCrm } from '@/hooks/useData'
import { ACTIVITY_TYPES } from '@/lib/constants'
import { dueBucket } from '@/lib/metrics'
import type { Activity } from '@/lib/types'
import { cn, toDate } from '@/lib/utils'
import { isTomorrow } from 'date-fns'

const TABS = [
  { value: 'overdue', filter: (a: Activity) => dueBucket(a) === 'overdue' },
  { value: 'today', filter: (a: Activity) => dueBucket(a) === 'today' },
  { value: 'upcoming', filter: (a: Activity) => dueBucket(a) === 'upcoming' },
  { value: 'done', filter: (a: Activity) => a.done },
  { value: 'all', filter: () => true },
] as const

type Tab = (typeof TABS)[number]['value']

const dueTime = (a: Activity) => (a.due_at ? toDate(a.due_at).getTime() : Number.MAX_SAFE_INTEGER)
const isChronological = (tab: Tab) => tab !== 'done' && tab !== 'all'

/** Upcoming tasks split like amoCRM's task list: tomorrow, this week, later. */
function upcomingBucket(a: Activity): 'tomorrow' | 'week' | 'later' {
  const due = toDate(a.due_at ?? '')
  if (isTomorrow(due)) return 'tomorrow'
  return due.getTime() - Date.now() < 7 * 86_400_000 ? 'week' : 'later'
}

export default function ActivitiesPage() {
  const { t } = useTranslation()
  const { isLoading, activities } = useCrm()
  const openModal = useEntityModal()
  // Opens on overdue work when there is any (amoCRM), otherwise on today.
  const [picked, setTab] = useState<Tab | null>(null)
  const [type, setType] = useState('')
  const [owner, setOwner] = useState('')
  const { members } = useMembers()

  const counts = useMemo(() => Object.fromEntries(TABS.map((x) => [x.value, activities.filter(x.filter).length])), [activities])
  const tab: Tab = picked ?? (counts.overdue ? 'overdue' : 'today')
  const rows = useMemo(() => {
    const active = TABS.find((x) => x.value === tab)!
    const list = activities.filter((a) => active.filter(a) && (!type || a.type === type) && (!owner || a.owner_id === owner))
    return isChronological(tab) ? [...list].sort((a, b) => dueTime(a) - dueTime(b)) : list
  }, [activities, tab, type, owner])
  const groups: { key: '' | ReturnType<typeof upcomingBucket>; rows: Activity[] }[] = tab === 'upcoming'
    ? (['tomorrow', 'week', 'later'] as const).map((b) => ({ key: b, rows: rows.filter((a) => upcomingBucket(a) === b) })).filter((g) => g.rows.length)
    : [{ key: '', rows }]

  if (isLoading) return <PageLoading title={t('activities.title')} />

  return (
    <Page
      title={t('activities.title')}
      description={t('activities.description')}
      actions={<CreateButton module="activities" onClick={() => openModal({ kind: 'activity' })}><Plus /> {t('activities.newActivity')}</CreateButton>}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="max-w-full overflow-x-auto">
          <TabsList>
            {TABS.map(({ value }) => (
              <TabsTrigger key={value} value={value}>
                {t(`activities.${value}`)}
                <span className={cn('rounded px-1 text-[10px] tabular-nums', value === 'overdue' && counts.overdue ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'opacity-60')}>{counts[value]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SelectBox value={owner} onChange={setOwner} emptyLabel={t('owner.all')} options={members.map((m) => ({ value: m.user_id, label: m.full_name }))} className="ml-auto w-40" />
        <SelectBox value={type} onChange={setType} emptyLabel={t('activities.allTypes')} options={ACTIVITY_TYPES.map((v) => ({ value: v, label: t(`enums.activity.${v}`) }))} className="w-40" />
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={tab === 'overdue' ? t('activities.emptyOverdue') : t('activities.empty')} description={t('activities.emptyDesc')} />
        ) : (
          groups.map((g) => (
            <section key={g.key}>
              {g.key && <h3 className="border-b border-foreground/[0.06] bg-foreground/[0.02] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(`tasks.buckets.${g.key}`)} · {g.rows.length}</h3>}
              <MotionList key={tab + type + owner + g.key} items={g.rows} className="divide-y divide-foreground/[0.06]" render={(a) => <ActivityRow activity={a} meta={<ActivityMeta activity={a} />} />} />
            </section>
          ))
        )}
      </Card>
    </Page>
  )
}
