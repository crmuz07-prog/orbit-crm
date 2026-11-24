import { useCallback, useRef, type ReactNode } from 'react'
import { CalendarPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Composer } from '@/features/activities/Composer'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { InstagramReply } from '@/features/instagram/InstagramReply'
import { useAccess } from '@/hooks/useAccess'
import { useCrm } from '@/hooks/useData'
import type { Activity, RecordLink } from '@/lib/types'
import { Feed } from './Feed'

type Links = { deal_id?: string | null; company_id?: string | null; contact_id?: string | null }

const isPlanned = (a: Activity) => a.type !== 'note' && a.type !== 'call' && !a.done

/** amoCRM's nudge above the composer when nothing is scheduled for this record. */
function TasksHint({ activities, links }: { activities: Activity[]; links: Links }) {
  const { t } = useTranslation()
  const openModal = useEntityModal()
  if (activities.some(isPlanned)) return null
  return (
    <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
      <CalendarPlus className="size-3.5" /> {t('feed.noTasks')}{' '}
      <button className="font-medium underline underline-offset-2" onClick={() => openModal({ kind: 'activity', initial: { type: 'task', ...links } })}>{t('feed.addTask')}</button>
    </div>
  )
}

/** Centre column: the feed scrolls (newest at the bottom, next to the composer, as in amoCRM). */
function FeedPanel({ link, recordId, activities, links }: { link: RecordLink; recordId: string; activities: Activity[]; links: Links }) {
  const { can } = useAccess()
  const { contactById } = useCrm()
  // People who wrote on Instagram can be answered from the card (amoCRM / Kommo chat in the lead card).
  const contact = links.contact_id ? contactById.get(links.contact_id) : undefined
  const instagramContact = contact?.instagram_id ? contact.id : undefined
  const scroller = useRef<HTMLDivElement>(null)
  // Called whenever the number of feed items changes (activities and history load separately). The braces matter:
  // scrollTo returns a promise in current browsers, and an effect must not return anything but a cleanup function.
  const toBottom = useCallback(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [])
  return (
    <section className="glass flex min-h-[520px] flex-col rounded-2xl lg:h-[calc(100vh-7rem)]">
      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-3"><Feed link={link} recordId={recordId} activities={activities} onItemsChange={toBottom} /></div>
      {can('activities', 'create') && (
        <div className="border-t border-foreground/[0.06] p-3">
          {instagramContact && <InstagramReply contactId={instagramContact} />}
          <TasksHint activities={activities} links={links} />
          <Composer links={links} />
        </div>
      )}
    </section>
  )
}

interface Props {
  /** Left panel: header and properties of the record. */
  info: ReactNode
  /** Right column widgets (time in stages, related records). */
  widgets?: ReactNode
  link: RecordLink
  recordId: string
  activities: Activity[]
  links: Links
}

/** The record card shared by deals, companies and contacts: info | feed | widgets. */
export function RecordCard({ info, widgets, link, recordId, activities, links }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)_300px]">
      <aside className="glass flex flex-col overflow-hidden rounded-2xl lg:h-[calc(100vh-7rem)]">
        <div className="flex-1 overflow-y-auto">{info}</div>
      </aside>
      <FeedPanel link={link} recordId={recordId} activities={activities} links={links} />
      {widgets && <aside className="space-y-4 lg:col-span-2 2xl:col-span-1">{widgets}</aside>}
    </div>
  )
}

/** Header block of the info panel: back link, title, short id, actions; children go under it (stage selector). */
export function InfoHeader({ back, title, shortId, actions, children }: { back: ReactNode; title: string; shortId: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-3 border-b border-foreground/[0.06] px-5 pb-4 pt-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {back}
          <h1 className="mt-1 line-clamp-2 break-words text-xl font-semibold tracking-tight" title={title}>{title}</h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{shortId}</p>
        </div>
        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function InfoSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="px-5 py-3">
      {title && <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
      {children}
    </section>
  )
}
