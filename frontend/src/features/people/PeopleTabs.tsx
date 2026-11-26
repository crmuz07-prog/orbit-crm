import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCrm } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { useAccess } from '@/hooks/useAccess'

const LAST_TAB = 'orbit:people-tab'

/** The Clients tab opened last, so the sidebar's "Clients" returns to it. */
export function lastPeopleTab(): '/contacts' | '/companies' {
  try {
    return localStorage.getItem(LAST_TAB) === '/companies' ? '/companies' : '/contacts'
  } catch {
    return '/contacts'
  }
}

/** amoCRM's "Clients" is one section: contacts and companies switch here (the sidebar has one entry for both). */
export function PeopleTabs() {
  const { t } = useTranslation()
  const { contacts, companies } = useCrm()
  const { can } = useAccess()
  const { pathname } = useLocation()
  useEffect(() => {
    try {
      localStorage.setItem(LAST_TAB, pathname.startsWith('/companies') ? '/companies' : '/contacts')
    } catch { /* storage unavailable: the sidebar opens contacts */ }
  }, [pathname])
  const tab = (to: string, label: string, count: number) => (
    <NavLink to={to} className={({ isActive }) => cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors',
      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
      {label} <span className="text-[11px] tabular-nums opacity-70">{count}</span>
    </NavLink>
  )
  return (
    <nav className="glass-subtle flex w-fit rounded-lg p-0.5" aria-label={t('people.section')}>
      {can('contacts', 'view') && tab('/contacts', t('nav.contacts'), contacts.length)}
      {can('companies', 'view') && tab('/companies', t('nav.companies'), companies.length)}
    </nav>
  )
}
