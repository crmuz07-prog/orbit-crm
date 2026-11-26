import { Fragment, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isToday, isYesterday } from 'date-fns'
import { MessageSquareText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common/states'
import { ActivityMeta } from '@/features/activities/ActivityLinks'
import { ActivityRow } from '@/features/activities/ActivityRow'
import { historyApi } from '@/lib/api'
import type { Activity, RecordEvent, RecordLink } from '@/lib/types'
import { shortDate, toDate } from '@/lib/utils'
import { MessageBubble } from '@/features/instagram/MessageBubble'
import { EventLine } from './EventLine'

type Item = { at: number; event?: RecordEvent; activity?: Activity }

// A call or meeting sits at the moment it happened; notes and tasks at the moment they were written.
const activityTime = (a: Activity) => toDate(a.type === 'call' || a.type === 'meeting' ? (a.due_at ?? a.created_at) : a.created_at).getTime()
const dayOf = (at: number) => new Date(at).toDateString()

function DaySeparator({ at }: { at: number }) {
  const { t } = useTranslation()
  const day = new Date(at)
  const label = isToday(day) ? t('feed.today') : isYesterday(day) ? t('feed.yesterday') : shortDate(day.toISOString())
  return (
    <div className="relative my-2 flex justify-center first:mt-0">
      <span className="absolute inset-x-0 top-1/2 h-px bg-foreground/[0.08]" />
      <span className="glass-subtle relative rounded-full px-3 py-0.5 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

/** amoCRM-style chronological feed: system lines for changes, cards for notes, calls and tasks, grouped by day. */
export function Feed({ link, recordId, activities, onItemsChange }: { link: RecordLink; recordId: string; activities: Activity[]; onItemsChange?: () => void }) {
  const { t } = useTranslation()
  const { data: events = [] } = useQuery({ queryKey: ['events', link, recordId], queryFn: () => historyApi.events(link, recordId) })
  const items = useMemo<Item[]>(
    () => [
      ...events.map((event) => ({ at: toDate(event.created_at).getTime(), event })),
      ...activities.map((activity) => ({ at: activityTime(activity), activity })),
    ].sort((a, b) => a.at - b.at),
    [events, activities],
  )
  useEffect(() => {
    onItemsChange?.()
  }, [items.length, onItemsChange])

  if (items.length === 0) {
    return <EmptyState icon={MessageSquareText} title={t('feed.empty')} compact className="flex-1" />
  }
  return (
    <div className="mt-auto space-y-1">
      {items.map((item, i) => (
        <Fragment key={item.event?.id ?? item.activity?.id}>
          {(i === 0 || dayOf(items[i - 1].at) !== dayOf(item.at)) && <DaySeparator at={item.at} />}
          {item.event && <EventLine event={item.event} link={link} />}
          {item.activity?.type === 'message' && <MessageBubble message={item.activity} />}
          {item.activity && item.activity.type !== 'message' && (
            <div className="glass-subtle rounded-xl">
              <ActivityRow activity={item.activity} meta={<ActivityMeta activity={item.activity} showType current={link} />} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}
