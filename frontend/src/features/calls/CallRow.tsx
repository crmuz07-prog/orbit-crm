import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PenLine, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Play, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/common/icon-button'
import { Button } from '@/components/ui/button'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useActivityActions } from '@/features/activities/useActivityActions'
import { useCrm } from '@/hooks/useData'
import type { Activity } from '@/lib/types'
import { cn, duration, fullName, timeOf, toDate } from '@/lib/utils'
import { needsSummary, OutcomeBadge } from './CallDetails'

/** Inbound green, outbound blue, a call that did not connect red — readable before reading anything. */
function DirectionIcon({ call }: { call: Activity }) {
  const missed = call.call_outcome && call.call_outcome !== 'connected'
  const Icon = missed ? PhoneMissed : call.call_direction === 'inbound' ? PhoneIncoming : PhoneOutgoing
  return (
    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg',
      missed ? 'bg-rose-500/10 text-rose-500' : call.call_direction === 'inbound' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500')}>
      <Icon className="size-4" />
    </span>
  )
}

/**
 * One call on one line (Aircall / Close call log): who, which deal, outcome, length, time — then call back, play the
 * recording (inline, on demand) and "write the summary" for answered auto-logged calls that still have none.
 */
export function CallRow({ call }: { call: Activity }) {
  const { t } = useTranslation()
  const { contactById, dealById } = useCrm()
  const openModal = useEntityModal()
  const actions = useActivityActions()
  const [playing, setPlaying] = useState(false)
  const contact = call.contact_id ? contactById.get(call.contact_id) : undefined
  const deal = call.deal_id ? dealById.get(call.deal_id) : undefined
  const who = contact ? fullName(contact) : call.phone || t('calls.list.unknown')
  const at = toDate(call.due_at ?? call.created_at)
  const note = call.body || call.next_steps

  return (
    <div className="group px-4 py-2">
      <div className="flex items-center gap-3">
        <DirectionIcon call={call} />
        <button type="button" onClick={() => actions.edit(call)} className="min-w-0 flex-1 text-left focus-visible:outline-none">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{who}</span>
            {/* Callers the PBX created are named after their number — no need to print it twice. */}
            {contact && call.phone && call.phone !== who && <span className="hidden truncate text-xs tabular-nums text-muted-foreground sm:inline">{call.phone}</span>}
            {call.auto_logged && <Zap className="size-3 shrink-0 text-violet-500" aria-label={t('telephony.auto')} />}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {deal ? <Link to={`/deals/${deal.id}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">{deal.title}</Link> : null}
            {deal && note ? ' · ' : null}
            {note}
          </span>
        </button>
        <span className="hidden shrink-0 sm:block">{call.call_outcome && <OutcomeBadge outcome={call.call_outcome} />}</span>
        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{call.duration_seconds ? duration(call.duration_seconds) : '—'}</span>
        <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{timeOf(at)}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          {call.recording_url && <IconButton label={t('calls.list.listen')} className="size-8" onClick={() => setPlaying((p) => !p)}><Play /></IconButton>}
          {(contact || call.phone) && (
            <IconButton label={t('calls.list.callBack')} className="size-8 text-emerald-600"
              onClick={() => openModal({ kind: 'call', initial: { contact_id: call.contact_id, deal_id: call.deal_id, company_id: call.company_id } })}><Phone /></IconButton>
          )}
        </div>
      </div>
      {needsSummary(call) && (
        <Button size="sm" variant="outline" className="ml-11 mt-1.5 h-7 text-xs" onClick={() => openModal({ kind: 'wrapUp', initial: call })}><PenLine /> {t('telephony.needsSummary')}</Button>
      )}
      {playing && call.recording_url && <audio controls autoPlay src={call.recording_url} className="ml-11 mt-1.5 h-8 w-full max-w-sm" aria-label={t('telephony.recording')} />}
    </div>
  )
}
