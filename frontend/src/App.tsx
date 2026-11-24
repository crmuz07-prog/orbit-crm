import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { PageSkeleton } from '@/components/common/states'
import { AppShell } from '@/components/layout/AppShell'
import { PasswordGate } from '@/features/auth/PasswordGate'
import { RequireView } from '@/features/auth/RequireView'
import { SubscriptionClosed } from '@/features/billing/SubscriptionClosed'
import type { Module } from '@/lib/types'
import { EntityModalProvider } from '@/features/entity-modal/EntityModalProvider'
import LoginPage from '@/pages/Login'

const page = (load: () => Promise<{ default: React.ComponentType }>) => lazy(load)

// The module decides who may open the page (null: every member).
const APP_ROUTES: [path: string, Component: React.ComponentType, module: Module | null][] = [
  ['deals', page(() => import('@/pages/Deals')), 'deals'],
  ['deals/:id', page(() => import('@/pages/DealDetail')), 'deals'],
  ['companies', page(() => import('@/pages/Companies')), 'companies'],
  ['companies/:id', page(() => import('@/pages/CompanyDetail')), 'companies'],
  ['contacts', page(() => import('@/pages/Contacts')), 'contacts'],
  ['contacts/:id', page(() => import('@/pages/ContactDetail')), 'contacts'],
  ['calls', page(() => import('@/pages/Calls')), 'activities'],
  ['activities', page(() => import('@/pages/Activities')), 'activities'],
  ['settings', page(() => import('@/pages/Settings')), null],
]
const Admin = page(() => import('@/pages/Admin'))
const Dashboard = page(() => import('@/pages/Dashboard'))

// Reachable signed in or out: they are opened from emailed / shared links.
const LINK_ROUTES: [path: string, Component: React.ComponentType][] = [
  ['/verify', page(() => import('@/pages/VerifyEmail'))],
  ['/reset', page(() => import('@/pages/ResetPassword'))],
  ['/forgot', page(() => import('@/pages/ForgotPassword'))],
]

function ServerWaking() {
  const { t } = useTranslation()
  return <p className="glass mb-6 rounded-xl px-4 py-3 text-sm text-muted-foreground">{t('auth.waking')}</p>
}

const linkRoutes = LINK_ROUTES.map(([path, Component]) => <Route key={path} path={path} element={<Component />} />)

export default function App() {
  const { session, loading, waking } = useAuth()
  // Remount routes on language change so every formatted date / number re-renders.
  const { i18n } = useTranslation()
  if (loading) return <div className="p-8">{waking && <ServerWaking />}<PageSkeleton /></div>

  if (!session) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes key={i18n.language}>
          {linkRoutes}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    )
  }

  // Admin-issued temporary password: nothing else is reachable until the person sets their own.
  if (session.user.must_change_password) return <PasswordGate />

  // A closed (expired or blocked) company shows why; the platform operator still works inside it.
  if (session.workspace && session.workspace.status !== 'active' && !session.user.is_superadmin) return <SubscriptionClosed />

  // A platform superadmin outside any company gets the same shell with the platform sections only.
  const inWorkspace = !!session.workspace
  const admin = session.user.is_superadmin && <Route path="admin/:section?" element={<Admin />} />

  return (
    <EntityModalProvider>
      <Suspense fallback={<PageSkeleton />}>
        <Routes key={i18n.language}>
          {linkRoutes}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route element={<AppShell />}>
            {inWorkspace && <Route index element={<RequireView module="reports"><Dashboard /></RequireView>} />}
            {inWorkspace && APP_ROUTES.map(([path, Component, module]) => (
              <Route key={path} path={path} element={<RequireView module={module}><Component /></RequireView>} />
            ))}
            {admin}
            <Route path="*" element={<Navigate to={inWorkspace ? '/' : '/admin/companies'} replace />} />
          </Route>
        </Routes>
      </Suspense>
    </EntityModalProvider>
  )
}
