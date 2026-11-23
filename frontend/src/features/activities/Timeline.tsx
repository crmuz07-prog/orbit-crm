import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react'
import { MotionList } from '@/components/common/motion-list'
import { EmptyState } from '@/components/common/states'
import { Card, CardHeader } from '@/components/ui/card'
import type { Activity } from '@/lib/types'
import { toDate } from '@/lib/utils'
import { ActivityMeta } from './ActivityLinks'
import { ActivityRow } from './ActivityRow'

const dueTime = (a: Activity) => (a.due_at ? toDate(a.due_at).getTime() : Infinity)
const isOpenTask = (a: Activity) => a.type !== 'note' && a.type !== 'call' && !a.done

function Section({ title, items, showDeal }: { title: string; items: Activity[]; showDeal: boolean }) {
  if (items.length === 0) return null
  return (
    <section>
      <h4 className="px-5 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h4>
      <MotionList items={items} render={(a) => <ActivityRow activity={a} meta={<ActivityMeta activity={a} showType showDeal={showDeal} />} />} />
    </section>
  )
}

/** HubSpot-style record timeline: pinned notes, then open scheduled items, then history. */
export function Timeline({ activities, showDeal = false }: { activities: Activity[]; showDeal?: boolean }) {
  const { t } = useTranslation()
  const pinned = activities.filter((a) => a.pinned)
  const upcoming = activities.filter((a) => !a.pinned && isOpenTask(a)).sort((a, b) => dueTime(a) - dueTime(b))
  const history = activities.filter((a) => !a.pinned && !isOpenTask(a))

  return (
    <Card className="pb-2">
      <CardHeader title={t('activities.timeline')} />
      {activities.length === 0 ? (
        <EmptyState icon={History} title={t('activities.timelineEmpty')} description={t('activities.timelineEmptyDesc')} />
      ) : (
        <>
          <Section title={t('activities.pinned')} items={pinned} showDeal={showDeal} />
          <Section title={t('activities.upcomingCount', { count: upcoming.length })} items={upcoming} showDeal={showDeal} />
          <Section title={t('activities.history')} items={history} showDeal={showDeal} />
        </>
      )}
    </Card>
  )
}
