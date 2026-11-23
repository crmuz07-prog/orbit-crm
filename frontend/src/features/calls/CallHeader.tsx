import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Phone, PhoneOff, Play } from 'lucide-react'
import { PersonAvatar } from '@/components/common/avatars'
import { Button } from '@/components/ui/button'
import type { Contact } from '@/lib/types'
import { duration, fullName } from '@/lib/utils'
import type { useCallTimer } from './useCallTimer'

type Timer = ReturnType<typeof useCallTimer>

function LiveDot() {
  return (
    <span className="relative flex size-2.5">
      <motion.span className="absolute inline-flex size-full rounded-full bg-emerald-400" animate={{ scale: [1, 2.2], opacity: [0.7, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
    </span>
  )
}

/** Contact card with click-to-dial and the live call timer (Aircall / Close dialer). */
export function CallHeader({ contact, companyName, timer }: { contact?: Contact; companyName?: string; timer: Timer }) {
  const { t } = useTranslation()
  const phone = contact?.phone

  return (
    <div className="glass-subtle flex flex-wrap items-center gap-4 rounded-2xl p-4">
      {contact && <PersonAvatar name={fullName(contact)} size="md" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{contact ? fullName(contact) : t('calls.dialogTitleBlank')}</p>
        <p className="truncate text-xs text-muted-foreground">{[contact?.title, companyName].filter(Boolean).join(' · ') || t('calls.noPhone')}</p>
        {phone && <a href={`tel:${phone}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium tabular-nums text-primary hover:underline"><Phone className="size-3.5" /> {phone}</a>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {timer.running && <LiveDot />} {timer.running ? t('calls.live') : t('calls.ready')}
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums">{duration(timer.seconds)}</p>
        </div>
        {timer.running ? (
          <Button variant="destructive" onClick={timer.stop}><PhoneOff /> {t('calls.end')}</Button>
        ) : (
          <Button variant="success" asChild={!!phone} onClick={timer.start}>
            {phone ? <a href={`tel:${phone}`}><Play /> {t('calls.start')}</a> : <><Play /> {t('calls.start')}</>}
          </Button>
        )}
      </div>
    </div>
  )
}
