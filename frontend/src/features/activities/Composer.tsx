import { useState, type FormEvent } from 'react'
import { addDays, format, setHours, startOfHour } from 'date-fns'
import { motion } from 'framer-motion'
import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-picker'
import { Input, Textarea } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCreateRow } from '@/hooks/useData'
import { remindAt, type ReminderKey } from '@/lib/reminders'
import type { Activity, ActivityType } from '@/lib/types'
import { fromLocalInput } from '@/lib/utils'
import { ACTIVITY_META } from './ActivityIcon'
import { ReminderSelect } from './ReminderSelect'

type Links = Partial<Pick<Activity, 'deal_id' | 'company_id' | 'contact_id'>>
// Calls have their own logging form and channel messages their own reply box.
type ComposerType = Exclude<ActivityType, 'call' | 'message'>

const TYPES: ComposerType[] = ['note', 'email', 'meeting', 'task']
const tomorrowAt10 = () => format(startOfHour(setHours(addDays(new Date(), 1), 10)), "yyyy-MM-dd'T'HH:mm")

/** Builds the activity payload. A note's first line becomes its subject. */
function toActivity(type: ComposerType, subject: string, body: string, due: string, reminder: ReminderKey, links: Links) {
  const isNote = type === 'note'
  const text = body.trim()
  const dueAt = isNote ? null : fromLocalInput(due)
  return {
    type,
    subject: isNote ? text.split('\n')[0].slice(0, 80) : subject.trim(),
    body: isNote ? (text.includes('\n') ? text : null) : text || null,
    due_at: dueAt,
    remind_at: type === 'task' || type === 'meeting' ? remindAt(dueAt, reminder) : null,
    // An email logged in the past is history, so it is already done.
    done: type === 'email' && !!due && new Date(due) <= new Date(),
    deal_id: links.deal_id ?? null,
    company_id: links.company_id ?? null,
    contact_id: links.contact_id ?? null,
  }
}

/** Inline composer on record pages — one click to log any touchpoint (HubSpot pattern). */
export function Composer({ links }: { links: Links }) {
  const { t } = useTranslation()
  const create = useCreateRow('activities')
  const openModal = useEntityModal()
  const [type, setType] = useState<ComposerType>('note')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [due, setDue] = useState(tomorrowAt10)
  const [reminder, setReminder] = useState<ReminderKey>('min15')
  const isNote = type === 'note'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const activity = toActivity(type, subject, body, due, reminder, links)
    if (!activity.subject) return toast.error(isNote ? t('validation.writeSomething') : t('validation.subject'))
    await create.mutateAsync(activity)
    toast.success(t('activities.logged', { type: t(`enums.activity.${type}`) }))
    setSubject('')
    setBody('')
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-foreground/[0.06] p-2">
        <Tabs value={type} onValueChange={(v) => setType(v as ComposerType)}>
          <TabsList className="h-8 border-0 bg-transparent p-0">
            {TYPES.map((value) => {
              const Icon = ACTIVITY_META[value].icon
              return <TabsTrigger key={value} value={value}><Icon /> {t(`enums.activity.${value}`)}</TabsTrigger>
            })}
          </TabsList>
        </Tabs>
        <Button type="button" size="sm" variant="outline" onClick={() => openModal({ kind: 'call', initial: links })}>
          <Phone className="text-emerald-500" /> {t('calls.logCall')}
        </Button>
      </div>
      <motion.div layout className="space-y-2.5 p-3">
        {!isNote && <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('activities.subject')} />}
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t(`activities.placeholder.${type}`)} className="min-h-[64px]" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isNote ? <span /> : (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {type === 'task' ? t('activities.due') : t('activities.when')}
              <DateTimePicker value={due} onChange={setDue} className="w-72" />
              {type !== 'email' && <ReminderSelect value={reminder} onChange={setReminder} className="h-8 w-44 text-xs" />}
            </div>
          )}
          <Button type="submit" size="sm" disabled={create.isPending}>{t(`activities.submit.${type}`)}</Button>
        </div>
      </motion.div>
    </form>
  )
}
