import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Page } from './page'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** "Nothing here" for a page (default) or inside a card / popover (`compact`): the one place empty spacing is decided. */
export function EmptyState({ icon: Icon, title, description, action, compact, className }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode; compact?: boolean; className?: string }) {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className={cn('flex flex-col items-center justify-center px-4 text-center', compact ? 'py-6' : 'py-12', className)}>
      <div className={cn('mb-2.5 flex items-center justify-center glass rounded-xl', compact ? 'size-9' : 'size-11')}>
        <Icon className={cn('text-muted-foreground', compact ? 'size-4' : 'size-5')} />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}

/** Placeholder for the content area only: the shell and the page header stay real (Linear-style loading). */
export function ContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

/** A page whose data is still loading: real title and description, skeleton only where the data will be. */
export function PageLoading({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <Page title={title} description={description}>
      <ContentSkeleton />
    </Page>
  )
}

/** Record card placeholder in the same three-column frame (info | feed | widgets). */
export function RecordSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]" aria-busy="true">
      <Skeleton className="h-[calc(100vh_-_3.5rem_-_2*var(--gutter))] min-h-[420px] rounded-2xl" />
      <Skeleton className="h-[calc(100vh_-_3.5rem_-_2*var(--gutter))] min-h-[420px] rounded-2xl" />
    </div>
  )
}

/** Kept for the very first paint before a session exists (no page title is known yet). */
export const PageSkeleton = ContentSkeleton
