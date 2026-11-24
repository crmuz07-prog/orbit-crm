import { Instagram } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMembers } from '@/features/team/useMembers'
import type { Activity } from '@/lib/types'
import { cn, timeOf, toDate } from '@/lib/utils'

/** A Direct message in the record feed: the customer on the left, the company on the right (chat layout). */
export function MessageBubble({ message }: { message: Activity }) {
  const { t } = useTranslation()
  const { memberById } = useMembers()
  const outbound = message.call_direction === 'outbound'
  const author = outbound ? (message.owner_id && memberById.get(message.owner_id)?.full_name) || t('igReply.you') : 'Instagram'
  return (
    <div className={cn('my-1.5 flex', outbound ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
        outbound ? 'rounded-br-md bg-primary/15 text-foreground' : 'glass-subtle rounded-bl-md')}>
        <p className="whitespace-pre-wrap break-words">{message.body ?? message.subject}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          {!outbound && <Instagram className="size-3 text-pink-500" />} {author} · {timeOf(toDate(message.due_at ?? message.created_at))}
        </p>
      </div>
    </div>
  )
}
