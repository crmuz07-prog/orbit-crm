import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/common/icon-button'
import { NextTaskBadge } from '@/features/deals/NextTaskBadge'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import type { NextTask } from '@/hooks/useNextTasks'
import { money, timeAgo } from '@/lib/utils'

/** Phone with a one-click "log a call" (amoCRM click-to-call); the row itself still opens the card. */
export function PhoneCell({ phone, links }: { phone: string | null; links: { contact_id?: string; company_id?: string } }) {
  const { t } = useTranslation()
  const openModal = useEntityModal()
  if (!phone) return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <a href={`tel:${phone}`} className="tabular-nums hover:text-primary hover:underline">{phone}</a>
      <IconButton label={t('calls.logCall')} className="size-6 text-emerald-600" onClick={() => openModal({ kind: 'call', initial: links })}><Phone /></IconButton>
    </span>
  )
}

export function EmailCell({ email }: { email: string | null }) {
  if (!email) return <span className="text-muted-foreground">—</span>
  return (
    <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className="inline-flex max-w-[200px] items-center gap-1 truncate hover:text-primary hover:underline">
      <Mail className="size-3 shrink-0 text-muted-foreground" /> <span className="truncate">{email}</span>
    </a>
  )
}

/** Open deals: count and amount, as amoCRM lists show them. */
export function DealsCell({ count, amount }: { count: number; amount: number }) {
  if (!count) return <span className="text-muted-foreground">—</span>
  return <span className="tabular-nums"><b className="font-medium">{count}</b> · {money(amount, undefined, true)}</span>
}

export function TaskCell({ next }: { next: NextTask }) {
  return next.state === 'none' ? <span className="text-muted-foreground">—</span> : <NextTaskBadge next={next} />
}

export function LastActivityCell({ at }: { at?: string }) {
  return <span className="text-muted-foreground">{at ? timeAgo(at) : '—'}</span>
}
