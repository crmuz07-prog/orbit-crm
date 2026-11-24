import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CALL_QUERIES } from '@/features/calls/useLogCall'
import { useAccess } from '@/hooks/useAccess'
import { useUpdateRow } from '@/hooks/useData'
import { api } from '@/lib/api'
import { isDue, SNOOZE_OPTIONS } from '@/lib/reminders'
import type { Activity } from '@/lib/types'
import { relativeDay } from '@/lib/utils'

const POLL_MS = 30_000
// More reminders than this arriving at once are summarised in a single toast.
const BURST = 2

export function useReminderActions() {
  const update = useUpdateRow('activities')
  const { t } = useTranslation()
  return {
    done: (a: Activity) => update.mutate({ id: a.id, patch: { done: true } }),
    snooze: (a: Activity, until: Date) => {
      update.mutate({ id: a.id, patch: { remind_at: until.toISOString() } })
      toast(t('reminder.snoozed', { time: relativeDay(until.toISOString()) }))
    },
  }
}

function notifyBrowser(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) new Notification(title, { body })
}

/** Polls pending reminders and announces each one once when it comes due. */
export function useReminders() {
  const { t } = useTranslation()
  const actions = useReminderActions()
  const announced = useRef(new Set<string>())
  const { can } = useAccess()
  const query = useQuery({ queryKey: CALL_QUERIES.reminders, queryFn: api.reminders, refetchInterval: POLL_MS, enabled: can('activities', 'view') })
  const reminders = useMemo(() => query.data ?? [], [query.data])
  const due = useMemo(() => reminders.filter((r) => isDue(r.remind_at)), [reminders])

  useEffect(() => {
    const fresh = due.filter((r) => !announced.current.has(`${r.id}:${r.remind_at}`))
    fresh.forEach((r) => announced.current.add(`${r.id}:${r.remind_at}`))
    if (fresh.length > BURST) {
      notifyBrowser(t('reminder.toast'), t('reminder.dueCount', { count: fresh.length }))
      toast(t('reminder.dueCount', { count: fresh.length }), { description: fresh.map((r) => r.subject).slice(0, 3).join(' · ') })
      return
    }
    for (const r of fresh) {
      notifyBrowser(t('reminder.toast'), r.subject)
      toast(t('reminder.toast'), {
        description: r.subject,
        duration: 12_000,
        action: { label: t('reminder.done'), onClick: () => actions.done(r) },
        cancel: { label: t('reminder.snooze10'), onClick: () => actions.snooze(r, SNOOZE_OPTIONS[0].until()) },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announce only when the due list changes
  }, [due])

  return { reminders, due, upcoming: reminders.filter((r) => !isDue(r.remind_at)) }
}
