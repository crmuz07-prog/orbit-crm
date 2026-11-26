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
import { cn } from '@/lib/utils'

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

// Heights below are "the window": 100vh minus the 3.5rem top bar and the page gutter above and below it. Tailwind
// only sees complete class names, so the value is written out in each class rather than built from a constant.
const CAPPED = 'lg:max-h-[calc(100vh_-_3.5rem_-_2*var(--gutter))]'

/** Centre column: the feed scrolls (newest at the bottom, next to the composer, as in amoCRM). */
function FeedPanel({ link, recordId, activities, links, className }: { link: RecordLink; recordId: string; activities: Activity[]; links: Links; className?: string }) {
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
    <section className={cn('glass flex min-h-[320px] flex-col rounded-2xl', className)}>
      {/* Newest at the bottom (amoCRM): a short feed rests on the composer instead of floating at the top. */}
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3"><Feed link={link} recordId={recordId} activities={activities} onItemsChange={toBottom} /></div>
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

/**
 * The record card shared by deals, companies and contacts.
 * Without widgets (company, contact) the page is the window split in two — info | feed — at every size from `sm` up:
 * both halves always fill the window and scroll inside themselves as the record grows; the page never scrolls.
 * With widgets (deal) the columns size to their content and the widgets follow (beside the feed at `2xl`).
 */
export function RecordCard({ info, widgets, link, recordId, activities, links }: Props) {
  const split = !widgets
  return (
    <div className={cn('grid grid-cols-1 gap-3',
      split
        ? 'sm:h-[calc(100vh_-_3.5rem_-_2*var(--gutter))] sm:grid-cols-[minmax(240px,2fr)_minmax(0,3fr)] sm:grid-rows-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]'
        : 'lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)_300px]')}>
      <aside className={cn('glass flex min-h-0 flex-col overflow-hidden rounded-2xl', !split && CAPPED)}>
        <div className="min-h-0 flex-1 overflow-y-auto">{info}</div>
      </aside>
      <FeedPanel link={link} recordId={recordId} activities={activities} links={links} className={split ? 'sm:min-h-0' : CAPPED} />
      {widgets && <aside className="grid content-start items-start gap-3 sm:grid-cols-2 lg:col-span-2 2xl:col-span-1 2xl:grid-cols-1">{widgets}</aside>}
    </div>
  )
}

/** Header block of the info panel: back link, title, short id, actions; children go under it (stage selector). */
export function InfoHeader({ back, title, shortId, actions, children }: { back: ReactNode; title: string; shortId: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-3 border-b border-foreground/[0.06] px-4 pb-3 pt-3">
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

/** The small uppercase heading of an info-panel section, with an optional action (e.g. "+") on the right. */
export function SectionHeading({ title, action, className }: { title?: string; action?: ReactNode; className?: string }) {
  if (!title && !action) return null
  return (
    <div className={cn('mb-1 flex min-h-7 items-center justify-between gap-2', className)}>
      {title && <h3 className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
      {action}
    </div>
  )
}

export function InfoSection({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-4 py-2.5">
      <SectionHeading title={title} action={action} />
      {children}
    </section>
  )
}
