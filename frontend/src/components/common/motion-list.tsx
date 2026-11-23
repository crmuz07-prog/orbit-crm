import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ease, stagger } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** <ul> whose items stagger in and animate out/reorder (used for timelines and task lists). */
export function MotionList<T extends { id: string }>({ items, render, className }: { items: T[]; render: (item: T) => ReactNode; className?: string }) {
  return (
    <motion.ul initial="hidden" animate="show" variants={stagger()} className={cn(className)}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
            exit={{ opacity: 0, height: 0, transition: ease }}
            transition={ease}
          >
            {render(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  )
}
