import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Logo } from '@/components/layout/Logo'
import { fadeUp, stagger } from '@/lib/motion'
import { LoginShowcase } from './LoginShowcase'

/** Glass card + marketing panel shared by sign-in, password reset, verification and invitations. */
export function AuthLayout({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="glass w-full max-w-md rounded-3xl p-8">
          <motion.div variants={fadeUp} className="mb-8 flex items-center justify-between"><Logo /><LanguageSwitcher /></motion.div>
          <motion.h1 variants={fadeUp} className="text-2xl font-semibold tracking-tight">{title}</motion.h1>
          {subtitle && <motion.p variants={fadeUp} className="mt-1 text-sm text-muted-foreground">{subtitle}</motion.p>}
          <motion.div variants={fadeUp} className="mt-8">{children}</motion.div>
        </motion.div>
      </div>
      <LoginShowcase />
    </div>
  )
}
