import { motion } from 'framer-motion'
import { KanbanSquare, PhoneCall, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fadeUp, stagger } from '@/lib/motion'

const FEATURES = [
  { icon: KanbanSquare, title: 'auth.f1', text: 'auth.f1Text' },
  { icon: PhoneCall, title: 'auth.f2', text: 'auth.f2Text' },
  { icon: ShieldCheck, title: 'auth.f3', text: 'auth.f3Text' },
] as const

/** Right-hand marketing panel of the auth screen, built from floating glass cards. */
export function LoginShowcase() {
  const { t } = useTranslation()
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--mesh-1)/.7),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--mesh-3)/.6),transparent_50%),radial-gradient(circle_at_70%_30%,hsl(var(--mesh-2)/.6),transparent_45%)]"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div initial="hidden" animate="show" variants={stagger(0.1)} className="relative flex h-full flex-col justify-center px-16">
        <motion.h2 variants={fadeUp} className="max-w-md text-3xl font-semibold leading-tight tracking-tight">{t('auth.tagline')}</motion.h2>
        <ul className="mt-10 max-w-md space-y-4">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <motion.li key={title} variants={fadeUp} whileHover={{ x: 4 }} className="glass flex gap-4 rounded-2xl p-4" style={{ marginLeft: i * 24 }}>
              <span className="glass-glow flex size-10 shrink-0 items-center justify-center rounded-xl text-white"><Icon className="size-5" /></span>
              <div>
                <p className="font-medium">{t(title)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t(text)}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
