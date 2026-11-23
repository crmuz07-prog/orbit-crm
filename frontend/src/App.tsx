import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { PageSkeleton } from '@/components/common/states'
import { AppShell } from '@/components/layout/AppShell'
import { EntityModalProvider } from '@/features/entity-modal/EntityModalProvider'
import LoginPage from '@/pages/Login'

const page = (load: () => Promise<{ default: React.ComponentType }>) => lazy(load)

const ROUTES: [path: string, Component: React.ComponentType][] = [
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
const Dashboard = page(() => import('@/pages/Dashboard'))

function ServerWaking() {
  const { t } = useTranslation()
  return <p className="glass mb-6 rounded-xl px-4 py-3 text-sm text-muted-foreground">{t('auth.waking')}</p>
}

export default function App() {
  const { session, loading, waking } = useAuth()
  // Remount routes on language change so every formatted date / number re-renders.
  const { i18n } = useTranslation()
  if (loading) return <div className="p-8">{waking && <ServerWaking />}<PageSkeleton /></div>
  if (!session) return <LoginPage />

  return (
    <EntityModalProvider>
      <Suspense fallback={<PageSkeleton />}>
        <Routes key={i18n.language}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            {ROUTES.map(([path, Component]) => <Route key={path} path={path} element={<Component />} />)}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </EntityModalProvider>
  )
}
