import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Page } from './page'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex size-11 items-center justify-center glass rounded-xl">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
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
      <Skeleton className="h-[calc(100vh-7rem)] min-h-[420px] rounded-2xl" />
      <Skeleton className="h-[calc(100vh-7rem)] min-h-[420px] rounded-2xl" />
    </div>
  )
}

/** Kept for the very first paint before a session exists (no page title is known yet). */
export const PageSkeleton = ContentSkeleton
