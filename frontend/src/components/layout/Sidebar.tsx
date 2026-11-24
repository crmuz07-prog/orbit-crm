import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Building2, CalendarCheck, Handshake, Instagram, LayoutDashboard, LogOut, Phone, Settings, ShieldCheck, Users, Wallet, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { WorkspaceSwitcher } from '@/features/auth/WorkspaceSwitcher'
import { useAccess } from '@/hooks/useAccess'
import { useCrm } from '@/hooks/useData'
import { dueBucket } from '@/lib/metrics'
import { spring } from '@/lib/motion'
import type { Module } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { IconButton } from '@/components/common/icon-button'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number; module?: Module }
type Navigate = { onNavigate?: () => void }

function NavItemLink({ to, label, icon: Icon, end, badge, onNavigate }: NavItem & Navigate) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className="relative">
      {({ isActive }) => (
        <span className={cn('relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
          {/* Shared layoutId slides the highlight between items (Linear-style). */}
          {isActive && <motion.span layoutId="nav-active" transition={spring} className="glass absolute inset-0 rounded-lg" />}
          <Icon className="relative size-4 opacity-80" />
          <span className="relative flex-1">{label}</span>
          {!!badge && <span className="relative rounded-full bg-rose-500/10 px-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{badge}</span>}
        </span>
      )}
    </NavLink>
  )
}

function NavSection({ title, items, onNavigate }: { title: string; items: NavItem[] } & Navigate) {
  if (items.length === 0) return null
  return (
    <nav className="flex flex-col gap-0.5">
      <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      {items.map((item) => <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />)}
    </nav>
  )
}

/** CRM sections the caller may view. */
function WorkspaceNav({ onNavigate }: Navigate) {
  const { activities } = useCrm()
  const { t } = useTranslation()
  const { can } = useAccess()
  const overdue = activities.filter((a) => dueBucket(a) === 'overdue').length
  const items: NavItem[] = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true, module: 'reports' },
    { to: '/deals', label: t('nav.deals'), icon: Handshake, module: 'deals' },
    { to: '/companies', label: t('nav.companies'), icon: Building2, module: 'companies' },
    { to: '/contacts', label: t('nav.contacts'), icon: Users, module: 'contacts' },
    { to: '/calls', label: t('nav.calls'), icon: Phone, module: 'activities' },
    { to: '/activities', label: t('nav.activities'), icon: CalendarCheck, badge: overdue, module: 'activities' },
    { to: '/reports', label: t('reports.nav'), icon: BarChart3, module: 'reports' },
    { to: '/instagram', label: t('instagram.nav'), icon: Instagram, module: 'reports' },
  ]
  return <NavSection title={t('nav.workspace')} items={items.filter((i) => can(i.module ?? null, 'view'))} onNavigate={onNavigate} />
}

/** Platform administration (superadmins): the same navigation model as the CRM, not a separate app. */
function PlatformNav({ onNavigate }: Navigate) {
  const { t } = useTranslation()
  const items: NavItem[] = [
    { to: '/admin/companies', label: t('admin.companies'), icon: Building2 },
    { to: '/admin/users', label: t('admin.users'), icon: Users },
    { to: '/admin/payments', label: t('billing.tab'), icon: Wallet },
    { to: '/admin/security', label: t('security.tab'), icon: ShieldCheck },
  ]
  return <NavSection title={t('admin.platform')} items={items} onNavigate={onNavigate} />
}

/** Header card for a superadmin outside any company (where the workspace switcher would be). */
function PlatformCard() {
  const { t } = useTranslation()
  return (
    <div className="glass-subtle flex items-center gap-2.5 rounded-xl px-3 py-2">
      <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary"><ShieldCheck className="size-4" /></span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{t('admin.platform')}</p>
        <p className="text-xs text-muted-foreground">{t('admin.superadmin')}</p>
      </div>
    </div>
  )
}

function UserCard() {
  const { session, signOut } = useAuth()
  const { t } = useTranslation()
  if (!session) return null
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
      <PersonAvatar name={session.user.full_name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{session.user.full_name}</p>
        <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <IconButton label={t('nav.signOut')} onClick={signOut}><LogOut /></IconButton>
    </div>
  )
}

export function Sidebar({ onNavigate }: Navigate) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const inWorkspace = !!session?.workspace
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-3">
      <div className="px-2"><Logo /></div>
      {inWorkspace ? <WorkspaceSwitcher /> : <PlatformCard />}
      {inWorkspace && <WorkspaceNav onNavigate={onNavigate} />}
      {session?.user.is_superadmin && <PlatformNav onNavigate={onNavigate} />}
      <div className="mt-auto flex flex-col gap-0.5">
        {inWorkspace && <NavItemLink to="/settings" label={t('nav.settings')} icon={Settings} onNavigate={onNavigate} />}
        <UserCard />
      </div>
    </div>
  )
}
