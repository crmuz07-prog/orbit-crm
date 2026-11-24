import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VerifyBanner } from '@/features/auth/VerifyBanner'
import { SubscriptionBanner } from '@/features/billing/SubscriptionBanner'
import { CallEventsProvider } from '@/features/telephony/CallEventsProvider'
import { CallScreenPop } from '@/features/telephony/CallScreenPop'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

function useHotkey(key: string, handler: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault()
        handler()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [key, handler])
}

function DemoBanner() {
  const { session } = useAuth()
  const { t } = useTranslation()
  if (!session?.workspace?.is_demo) return null
  return (
    <div className="border-b border-primary/15 bg-primary/10 px-4 py-1.5 text-center text-xs text-primary backdrop-blur">
      {t('nav.demoBanner')}
    </div>
  )
}

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false)
  const [palette, setPalette] = useState(false)
  const location = useLocation()
  const { t } = useTranslation()
  useHotkey('k', useCallback(() => setPalette((p) => !p), []))
  useEffect(() => setMobileNav(false), [location.pathname])

  return (
    <CallEventsProvider>
    <div className="min-h-screen">
      <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-60 rounded-none border-y-0 border-l-0 lg:block">
        <Sidebar />
      </aside>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent>
          <SheetTitle className="sr-only">{t('nav.openMenu')}</SheetTitle>
          <Sidebar onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <DemoBanner />
        <SubscriptionBanner />
        <VerifyBanner />
        <Topbar onOpenNav={() => setMobileNav(true)} onOpenPalette={() => setPalette(true)} />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette open={palette} onOpenChange={setPalette} />
      <CallScreenPop />
    </div>
    </CallEventsProvider>
  )
}
