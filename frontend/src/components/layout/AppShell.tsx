import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { ContentSkeleton } from '@/components/common/states'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VerifyBanner } from '@/features/auth/VerifyBanner'
import { SubscriptionBanner } from '@/features/billing/SubscriptionBanner'
import { CallEventsProvider } from '@/features/telephony/CallEventsProvider'
import { CallScreenPop } from '@/features/telephony/CallScreenPop'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { usePersistentState } from '@/hooks/usePersistentState'
import { cn } from '@/lib/utils'

const SIDEBAR = ['open', 'collapsed'] as const

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

/** CRM-only machinery: live call events, the incoming-call pop-up and the ⌘K record palette. */
function WorkspaceExtras({ palette, setPalette, children }: { palette: boolean; setPalette: (open: boolean) => void; children: ReactNode }) {
  return (
    <CallEventsProvider>
      {children}
      <CommandPalette open={palette} onOpenChange={setPalette} />
      <CallScreenPop />
    </CallEventsProvider>
  )
}

/** The only app layout: CRM users and platform superadmins share the same sidebar, top bar and page frame. */
export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false)
  // Desktop sidebar: full or an icon rail, remembered per browser (⌘B / Ctrl+B like VS Code and Linear).
  const [rail, setRail] = usePersistentState('orbit:sidebar', 'open', SIDEBAR)
  const collapsed = rail === 'collapsed'
  const toggleRail = useCallback(() => setRail((r) => (r === 'open' ? 'collapsed' : 'open')), [setRail])
  useHotkey('b', toggleRail)
  const [palette, setPalette] = useState(false)
  const location = useLocation()
  const { t } = useTranslation()
  const inWorkspace = !!useAuth().session?.workspace
  useHotkey('k', useCallback(() => inWorkspace && setPalette((p) => !p), [inWorkspace]))
  useEffect(() => setMobileNav(false), [location.pathname])

  const frame = (
    <div className="min-h-screen">
      <aside className={cn('glass fixed inset-y-0 left-0 z-20 hidden rounded-none border-y-0 border-l-0 transition-[width] duration-200 lg:block', collapsed ? 'w-14' : 'w-52')}>
        <Sidebar collapsed={collapsed} onToggle={toggleRail} />
      </aside>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent>
          <SheetTitle className="sr-only">{t('nav.openMenu')}</SheetTitle>
          <Sidebar onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-14' : 'lg:pl-52')}>
        <DemoBanner />
        <SubscriptionBanner />
        <VerifyBanner />
        <Topbar onOpenNav={() => setMobileNav(true)} onOpenPalette={() => setPalette(true)} inWorkspace={inWorkspace} />
        <main className="mx-auto max-w-[1680px] px-[var(--gutter)] py-[var(--gutter)]">
          {/* Enter-only page transition. An exit animation (AnimatePresence mode="wait") could be interrupted by fast
              back-and-forth navigation and leave the new page stuck at opacity 0 — a blank screen. */}
          {/* Inside the shell, so a page whose code is still loading never hides the sidebar and top bar; outside the
              keyed wrapper, so a navigation (a router transition) keeps the current page on screen until the next one is
              ready instead of flashing the fallback. */}
          <Suspense fallback={<ContentSkeleton />}>
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>
    </div>
  )
  return inWorkspace ? <WorkspaceExtras palette={palette} setPalette={setPalette}>{frame}</WorkspaceExtras> : frame
}
