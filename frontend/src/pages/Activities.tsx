import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarCheck, Plus } from 'lucide-react'
import { SelectBox } from '@/components/common/form-fields'
import { MotionList } from '@/components/common/motion-list'
import { Page } from '@/components/common/page'
import { EmptyState, PageSkeleton } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityMeta } from '@/features/activities/ActivityLinks'
import { ActivityRow } from '@/features/activities/ActivityRow'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { ACTIVITY_TYPES } from '@/lib/constants'
import { dueBucket } from '@/lib/metrics'
import type { Activity } from '@/lib/types'
import { cn, toDate } from '@/lib/utils'

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

export default function ActivitiesPage() {
  const { t } = useTranslation()
  const { isLoading, activities } = useCrm()
  const openModal = useEntityModal()
  const [tab, setTab] = useState<Tab>('today')
  const [type, setType] = useState('')

  const counts = useMemo(() => Object.fromEntries(TABS.map((x) => [x.value, activities.filter(x.filter).length])), [activities])
  const rows = useMemo(() => {
    const active = TABS.find((x) => x.value === tab)!
    const list = activities.filter((a) => active.filter(a) && (!type || a.type === type))
    return isChronological(tab) ? [...list].sort((a, b) => dueTime(a) - dueTime(b)) : list
  }, [activities, tab, type])

  if (isLoading) return <PageSkeleton />

  return (
    <Page
      title={t('activities.title')}
      description={t('activities.description')}
      actions={<Button onClick={() => openModal({ kind: 'activity' })}><Plus /> {t('activities.newActivity')}</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <SelectBox value={type} onChange={setType} emptyLabel={t('activities.allTypes')} options={ACTIVITY_TYPES.map((v) => ({ value: v, label: t(`enums.activity.${v}`) }))} className="ml-auto w-40" />
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={tab === 'overdue' ? t('activities.emptyOverdue') : t('activities.empty')} description={t('activities.emptyDesc')} />
        ) : (
          <MotionList key={tab + type} items={rows} className="divide-y divide-foreground/[0.06]" render={(a) => <ActivityRow activity={a} meta={<ActivityMeta activity={a} />} />} />
        )}
      </Card>
    </Page>
  )
}
