import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { PageSkeleton } from '@/components/common/states'
import { AdminShell } from '@/components/layout/AdminShell'
import { AppShell } from '@/components/layout/AppShell'
import { PasswordGate } from '@/features/auth/PasswordGate'
import { EntityModalProvider } from '@/features/entity-modal/EntityModalProvider'
import LoginPage from '@/pages/Login'

const page = (load: () => Promise<{ default: React.ComponentType }>) => lazy(load)

const APP_ROUTES: [path: string, Component: React.ComponentType][] = [
  ['deals', page(() => import('@/pages/Deals'))],
  ['deals/:id', page(() => import('@/pages/DealDetail'))],
  ['companies', page(() => import('@/pages/Companies'))],
  ['companies/:id', page(() => import('@/pages/CompanyDetail'))],
  ['contacts', page(() => import('@/pages/Contacts'))],
  ['contacts/:id', page(() => import('@/pages/ContactDetail'))],
  ['calls', page(() => import('@/pages/Calls'))],
  ['activities', page(() => import('@/pages/Activities'))],
  ['settings', page(() => import('@/pages/Settings'))],
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

  // A platform superadmin outside any company only has the admin panel.
  if (!session.workspace) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes key={i18n.language}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    )
  }

  return (
    <EntityModalProvider>
      <Suspense fallback={<PageSkeleton />}>
        <Routes key={i18n.language}>
          {linkRoutes}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            {APP_ROUTES.map(([path, Component]) => <Route key={path} path={path} element={<Component />} />)}
            {session.user.is_superadmin && <Route path="admin" element={<Admin />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </EntityModalProvider>
  )
}
