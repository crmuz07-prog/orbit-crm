import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

/** Counts up to `value` (KPI cards). */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion()
  const motionValue = useMotionValue(reduce ? value : 0)
  const text = useTransform(motionValue, format)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, reduce, motionValue])

  return <motion.span className="tabular-nums">{text}</motion.span>
}
