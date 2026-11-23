import type { Transition, Variants } from 'framer-motion'

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
export const ease: Transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: ease },
}

export const stagger = (delay = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})
