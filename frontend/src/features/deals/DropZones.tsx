import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { ThumbsDown, Trash2, Trophy, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type Zone = 'won' | 'lost' | 'delete'
export const ZONE_PREFIX = 'zone:'

const STYLE: Record<Zone, { icon: LucideIcon; tone: string; over: string }> = {
  won: { icon: Trophy, tone: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300', over: 'bg-emerald-500/20' },
  lost: { icon: ThumbsDown, tone: 'border-rose-500/40 text-rose-700 dark:text-rose-300', over: 'bg-rose-500/20' },
  delete: { icon: Trash2, tone: 'border-foreground/20 text-muted-foreground', over: 'bg-foreground/10' },
}

function ZoneTarget({ zone }: { zone: Zone }) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: `${ZONE_PREFIX}${zone}` })
  const { icon: Icon, tone, over } = STYLE[zone]
  return (
    <div ref={setNodeRef} className={cn('glass-strong flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[13px] font-semibold transition-colors', tone, isOver && over)}>
      <Icon className="size-4" /> {t(`deals.zones.${zone}`)}
    </div>
  )
}

/** amoCRM's drop bar: while a card is dragged, won / lost / delete wait at the bottom of the screen. */
export function DropZones({ zones }: { zones: Zone[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-3xl gap-3">
      {zones.map((z) => <ZoneTarget key={z} zone={z} />)}
    </motion.div>
  )
}
