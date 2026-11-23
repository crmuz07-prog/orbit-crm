import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PenLine, PhoneIncoming, PhoneMissed, PhoneOutgoing, X } from 'lucide-react'
import { PersonAvatar } from '@/components/common/avatars'
import { Button } from '@/components/ui/button'
import { OutcomeBadge } from '@/features/calls/CallDetails'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { spring } from '@/lib/motion'
import { cn, duration } from '@/lib/utils'
import { useCallEvents, type LiveCall } from './CallEventsProvider'

function useElapsed(since?: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!since) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [since])
  return since ? Math.max(0, Math.round((now - since) / 1000)) : 0
}

function StatusLine({ live }: { live: LiveCall }) {
  const { t } = useTranslation()
  const elapsed = useElapsed(live.type === 'answered' ? live.answeredAt : undefined)
  if (live.type === 'ringing') return <span className="animate-pulse text-primary">{t('telephony.ringing')}</span>
  if (live.type === 'answered') return <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{t('telephony.onCall')} · {duration(elapsed)}</span>
  return <span>{t('telephony.ended')} · {duration(live.call.duration_seconds ?? 0)}</span>
}

function EndedActions({ live, onClose }: { live: LiveCall; onClose: () => void }) {
  const { t } = useTranslation()
  const openModal = useEntityModal()
  if (live.call.call_outcome !== 'connected') {
    return <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"><PhoneMissed className="size-3.5" /> {t('telephony.missedTask')}</p>
  }
  return (
    <Button size="sm" className="w-full" onClick={() => { openModal({ kind: 'wrapUp', initial: live.call }); onClose() }}>
      <PenLine /> {t('telephony.wrapUp')}
    </Button>
  )
}

function CallCard({ live }: { live: LiveCall }) {
  const { t } = useTranslation()
  const { dismiss } = useCallEvents()
  const { call } = live
  const name = live.contact_name ?? call.phone ?? t('telephony.unknown')
  const Icon = call.call_direction === 'inbound' ? PhoneIncoming : PhoneOutgoing
  const ringing = live.type === 'ringing'

  return (
    <motion.div layout initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -40 }} transition={spring} className="glass-strong w-80 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="relative">
          <PersonAvatar name={name} size="md" />
          <span className={cn('absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-white', live.type === 'ended' ? 'bg-zinc-400' : 'bg-emerald-500', ringing && 'animate-bounce')}>
            <Icon className="size-3" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{call.call_direction === 'inbound' ? t('telephony.incoming') : t('telephony.outgoing')}</p>
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{[live.company_name, live.deal_title].filter(Boolean).join(' · ') || call.phone}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => dismiss(call.id)} aria-label={t('telephony.dismiss')}><X /></Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <StatusLine live={live} />
        {call.call_outcome && <OutcomeBadge outcome={call.call_outcome} />}
        {call.contact_id && <Link to={`/contacts/${call.contact_id}`} className="text-xs font-medium text-primary hover:underline">{t('telephony.openRecord')}</Link>}
      </div>
      {live.type === 'ended' && <div className="mt-3"><EndedActions live={live} onClose={() => dismiss(call.id)} /></div>}
    </motion.div>
  )
}

/** Aircall-style screen pop: appears for every live call reported by the PBX. */
export function CallScreenPop() {
  const { calls } = useCallEvents()
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 flex flex-col gap-3 lg:left-64 [&>*]:pointer-events-auto">
      <AnimatePresence>{calls.map((live) => <CallCard key={live.call.id} live={live} />)}</AnimatePresence>
    </div>
  )
}
