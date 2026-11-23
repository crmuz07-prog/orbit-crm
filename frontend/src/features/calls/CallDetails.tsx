import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock, PenLine, PhoneIncoming, PhoneOutgoing, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { CALL_OUTCOMES } from '@/lib/constants'
import type { Activity, CallOutcome } from '@/lib/types'
import { duration } from '@/lib/utils'

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const { t } = useTranslation()
  const tone = CALL_OUTCOMES.find((o) => o.value === outcome)?.tone ?? 'gray'
  return <Badge tone={tone}>{t(`enums.outcome.${outcome}`)}</Badge>
}

/** An auto-captured, answered call still waiting for "what was discussed". */
export const needsSummary = (a: Activity) => a.auto_logged && a.done && a.call_outcome === 'connected' && !a.body

/** Call-specific facts shown under a call in any activity list. */
export function CallDetails({ activity: a, showWrapUp = true }: { activity: Activity; showWrapUp?: boolean }) {
  const { t } = useTranslation()
  const openModal = useEntityModal()
  const Direction = a.call_direction === 'inbound' ? PhoneIncoming : PhoneOutgoing

  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {a.auto_logged && <Badge tone="violet"><Zap className="size-3" /> {t('telephony.auto')}</Badge>}
        {!a.done && a.auto_logged && <Badge tone="green">{t('telephony.live')}</Badge>}
        {a.call_outcome && <OutcomeBadge outcome={a.call_outcome} />}
        {a.call_direction && <span className="inline-flex items-center gap-1"><Direction className="size-3" /> {t(`enums.direction.${a.call_direction}`)}</span>}
        {a.duration_seconds !== null && <span className="inline-flex items-center gap-1 tabular-nums"><Clock className="size-3" /> {duration(a.duration_seconds)}</span>}
        {a.phone && <span className="tabular-nums">{a.phone}</span>}
      </div>
      {a.next_steps && (
        <p className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <ArrowRight className="size-3" /> {a.next_steps}
        </p>
      )}
      {a.recording_url && <audio controls preload="none" src={a.recording_url} className="h-8 w-full max-w-sm" aria-label={t('telephony.recording')} />}
      {showWrapUp && needsSummary(a) && (
        <Button size="sm" variant="outline" onClick={() => openModal({ kind: 'wrapUp', initial: a })}><PenLine /> {t('telephony.needsSummary')}</Button>
      )}
    </div>
  )
}
