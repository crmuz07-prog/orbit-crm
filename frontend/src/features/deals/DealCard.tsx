import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Hourglass, Timer } from 'lucide-react'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { FieldChips } from '@/features/fields/FieldChips'
import { dealWarnings, useCustomFields } from '@/features/fields/useFields'
import { useCrm } from '@/hooks/useData'
import { useNextTasks } from '@/hooks/useNextTasks'
import { daysInStage, daysSince, isCloseOverdue, isStageOverdue, isStale } from '@/lib/metrics'
import { spring } from '@/lib/motion'
import type { Deal } from '@/lib/types'
import { cn, fullName, money, shortDate } from '@/lib/utils'
import { PriorityFlag } from './bits'
import { NextTaskBadge } from './NextTaskBadge'

function CardMeta({ deal }: { deal: Deal }) {
  const { stageById } = useCrm()
  const { t } = useTranslation()
  const stale = isStale(deal, stageById)
  const overdue = isStageOverdue(deal, stageById)
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] empty:hidden">
      {deal.expected_close_date && (
        <span className={cn('inline-flex items-center gap-1', isCloseOverdue(deal, stageById) ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
          <CalendarDays className="size-3" /> {shortDate(deal.expected_close_date)}
        </span>
      )}
      {overdue && (
        <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
          <Timer className="size-3" /> {t('board.inStage', { count: daysInStage(deal) })}
        </span>
      )}
      {stale && (
        <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
          <Hourglass className="size-3" /> {t('deals.idle', { days: daysSince(deal.updated_at) })}
        </span>
      )}
    </div>
  )
}

export function DealCardBody({ deal, overlay }: { deal: Deal; overlay?: boolean }) {
  const { companyById, contactById, stageById } = useCrm()
  const fields = useCustomFields()
  const nextTask = useNextTasks()(deal.id)
  const company = deal.company_id ? companyById.get(deal.company_id) : undefined
  const contact = deal.contact_id ? contactById.get(deal.contact_id) : undefined
  const closed = stageById.get(deal.stage_id)?.is_won || stageById.get(deal.stage_id)?.is_lost
  const warned = dealWarnings(deal, fields).length > 0

  return (
    <div
      className={cn(
        'rounded-xl bg-card/80 p-2.5 shadow-sm ring-1 ring-foreground/[0.06] transition-[box-shadow] dark:bg-white/[0.06]',
        isStale(deal, stageById) && 'ring-rose-300/60 dark:ring-rose-500/30',
        isStageOverdue(deal, stageById) && 'ring-amber-400/60 dark:ring-amber-500/40',
        !closed && nextTask.state === 'overdue' && 'ring-rose-400/70 dark:ring-rose-500/50',
        warned && 'border-l-2 border-l-rose-500',
        overlay ? 'rotate-[1.5deg] cursor-grabbing shadow-xl ring-2 ring-primary/30' : 'hover:shadow-md hover:ring-foreground/15',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug">{deal.title}</p>
        {/* Only a high priority is signal on a dense board; medium is the default for every lead. */}
        {deal.priority === 'high' && <PriorityFlag priority={deal.priority} />}
      </div>
      {company && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CompanyLogo name={company.name} size="xs" className="rounded" />
          <span className="truncate">{company.name}</span>
        </div>
      )}
      <FieldChips deal={deal} fields={fields} className="mt-1.5" />
      <div className="mt-2 flex items-center justify-between gap-2">
        {deal.amount > 0 ? <span className="text-[13px] font-semibold tabular-nums">{money(deal.amount, deal.currency)}</span>
          : !closed ? <NextTaskBadge next={nextTask} className="min-w-0" /> : <span />}
        {contact && <PersonAvatar name={fullName(contact)} size="xs" />}
      </div>
      {deal.amount > 0 && !closed && <NextTaskBadge next={nextTask} className="mt-1.5" />}
      <CardMeta deal={deal} />
    </div>
  )
}

export function DealCard({ deal }: { deal: Deal }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id })
  return (
    <motion.div
      ref={setNodeRef}
      layout
      layoutId={deal.id}
      transition={spring}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/deals/${deal.id}`)}
      className={cn('cursor-grab touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring', isDragging && 'opacity-30')}
    >
      <DealCardBody deal={deal} />
    </motion.div>
  )
}
