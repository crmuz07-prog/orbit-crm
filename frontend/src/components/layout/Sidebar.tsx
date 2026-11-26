import { BarChart3, Building2, CalendarCheck, Handshake, Instagram, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Phone, Settings, ShieldCheck, Users, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { IconButton } from '@/components/common/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { useConfirmedSignOut } from '@/features/auth/useSignOut'
import { WorkspaceSwitcher } from '@/features/auth/WorkspaceSwitcher'
import { useAccess } from '@/hooks/useAccess'
import { useCrm } from '@/hooks/useData'
import { dueBucket } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { lastPeopleTab } from '@/features/people/PeopleTabs'
import { NavItemLink, NavSection, type NavItem, type NavProps } from './SidebarNav'

/** CRM sections the caller may view. The section title only matters next to the platform section. */
function WorkspaceNav({ titled, ...nav }: NavProps & { titled: boolean }) {
  const { activities } = useCrm()
  const { t } = useTranslation()
  const { can } = useAccess()
  const overdue = activities.filter((a) => dueBucket(a) === 'overdue').length
  const peopleTo = can('contacts', 'view') ? lastPeopleTab() : '/companies'
  const peopleItem: NavItem = { to: peopleTo, label: t('nav.clients'), icon: Users, module: peopleTo === '/companies' ? 'companies' : 'contacts', also: ['/contacts', '/companies'] }
  const items: NavItem[] = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true, module: 'reports' },
    { to: '/deals', label: t('nav.deals'), icon: Handshake, module: 'deals' },
    // One "Clients" section (amoCRM): contacts and companies switch with the tabs inside it.
    peopleItem,
    { to: '/calls', label: t('nav.calls'), icon: Phone, module: 'activities' },
    { to: '/tasks', label: t('nav.activities'), icon: CalendarCheck, badge: overdue, module: 'activities' },
    { to: '/reports', label: t('reports.nav'), icon: BarChart3, module: 'reports' },
    { to: '/instagram', label: t('instagram.nav'), icon: Instagram, module: 'reports' },
  ]
  return <NavSection title={titled ? t('nav.workspace') : undefined} items={items.filter((i) => can(i.module ?? null, 'view'))} {...nav} />
}

/** Platform administration (superadmins): the same navigation model as the CRM, not a separate app. */
function PlatformNav(nav: NavProps) {
  const { t } = useTranslation()
  const items: NavItem[] = [
    { to: '/admin/companies', label: t('admin.companies'), icon: Building2 },
    { to: '/admin/users', label: t('admin.users'), icon: Users },
    { to: '/admin/payments', label: t('billing.tab'), icon: Wallet },
    { to: '/admin/security', label: t('security.tab'), icon: ShieldCheck },
  ]
  return <NavSection title={t('admin.platform')} items={items} {...nav} />
}

/** Who is signed in: avatar and name (e-mail in the tooltip) and sign-out. */
function UserCard({ collapsed }: { collapsed?: boolean }) {
  const { session } = useAuth()
  const signOut = useConfirmedSignOut()
  const { t } = useTranslation()
  if (!session) return null
  const avatar = <span className="shrink-0"><PersonAvatar name={session.user.full_name} /></span>
  return (
    <div className={cn('flex items-center gap-2 border-t border-foreground/[0.06] pt-2', collapsed && 'flex-col')}>
      <Tooltip content={session.user.email} side={collapsed ? 'right' : 'top'}>{avatar}</Tooltip>
      {!collapsed && <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{session.user.full_name}</p>}
      <IconButton label={t('nav.signOut')} side={collapsed ? 'right' : 'top'} className="size-7" onClick={signOut}><LogOut /></IconButton>
    </div>
  )
}

interface Props extends NavProps {
  /** Desktop only: collapse to an icon rail; absent in the mobile sheet. */
  onToggle?: () => void
}

export function Sidebar({ onNavigate, collapsed = false, onToggle }: Props) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const inWorkspace = !!session?.workspace
  const superadmin = !!session?.user.is_superadmin
  const nav = { onNavigate, collapsed }
  const toggle = onToggle && (
    <IconButton label={collapsed ? t('nav.expand') : t('nav.collapse')} side="right" className="size-7 text-muted-foreground" onClick={onToggle}>
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </IconButton>
  )
  return (
    <div className={cn('flex h-full flex-col gap-3 overflow-y-auto py-3', collapsed ? 'items-stretch px-2' : 'px-2.5')}>
      <div className={cn('flex items-center gap-1', collapsed && 'flex-col gap-2')}>
        {inWorkspace ? <WorkspaceSwitcher compact={collapsed} /> : <div className="flex-1 px-1.5"><Logo withName={!collapsed} /></div>}
        {toggle}
      </div>
      {inWorkspace && <WorkspaceNav {...nav} titled={superadmin} />}
      {superadmin && <PlatformNav {...nav} />}
      <div className="mt-auto flex flex-col gap-1">
        {inWorkspace && <NavItemLink to="/settings" label={t('nav.settings')} icon={Settings} {...nav} />}
        <UserCard collapsed={collapsed} />
      </div>
    </div>
  )
}
