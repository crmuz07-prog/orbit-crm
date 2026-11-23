import { CheckSquare, Mail, Phone, StickyNote, Video, type LucideIcon } from 'lucide-react'
import type { ActivityType } from '@/lib/types'
import { cn } from '@/lib/utils'

export const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  note: { icon: StickyNote, className: 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' },
  call: { icon: Phone, className: 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' },
  email: { icon: Mail, className: 'bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20' },
  meeting: { icon: Video, className: 'bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20' },
  task: { icon: CheckSquare, className: 'bg-indigo-50 text-indigo-600 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20' },
}

export function ActivityIcon({ type, className }: { type: ActivityType; className?: string }) {
  const { icon: Icon, className: tone } = ACTIVITY_META[type]
  return (
    <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset', tone, className)}>
      <Icon className="size-3.5" />
    </span>
  )
}
