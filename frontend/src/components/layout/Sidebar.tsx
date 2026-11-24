import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, CalendarCheck, Handshake, LayoutDashboard, LogOut, Phone, Settings, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { Button } from '@/components/ui/button'
import { WorkspaceSwitcher } from '@/features/auth/WorkspaceSwitcher'
import { Tooltip } from '@/components/ui/tooltip'
import { useCrm } from '@/hooks/useData'
import { dueBucket } from '@/lib/metrics'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number }

function NavItemLink({ to, label, icon: Icon, end, badge, onNavigate }: NavItem & { onNavigate?: () => void }) {
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
      <Tooltip content={t('nav.signOut')}>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label={t('nav.signOut')}><LogOut /></Button>
      </Tooltip>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { activities } = useCrm()
  const { t } = useTranslation()
  const { session } = useAuth()
  const overdue = activities.filter((a) => dueBucket(a) === 'overdue').length
  const items: NavItem[] = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/deals', label: t('nav.deals'), icon: Handshake },
    { to: '/companies', label: t('nav.companies'), icon: Building2 },
    { to: '/contacts', label: t('nav.contacts'), icon: Users },
    { to: '/calls', label: t('nav.calls'), icon: Phone },
    { to: '/activities', label: t('nav.activities'), icon: CalendarCheck, badge: overdue },
  ]

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <div className="px-2"><Logo /></div>
      <WorkspaceSwitcher />
      <nav className="flex flex-col gap-0.5">
        <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('nav.workspace')}</p>
        {items.map((item) => <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />)}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        {session?.user.is_superadmin && <NavItemLink to="/admin" label={t('admin.nav')} icon={ShieldCheck} onNavigate={onNavigate} />}
        <NavItemLink to="/settings" label={t('nav.settings')} icon={Settings} onNavigate={onNavigate} />
        <UserCard />
      </div>
    </div>
  )
}
