import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCrm } from '@/hooks/useData'
import { cn } from '@/lib/utils'

/** amoCRM's "Contacts and companies" is one section: the two lists switch from the same place. */
export function PeopleTabs() {
  const { t } = useTranslation()
  const { contacts, companies } = useCrm()
  const tab = (to: string, label: string, count: number) => (
    <NavLink to={to} className={({ isActive }) => cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors',
      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
      {label} <span className="text-[11px] tabular-nums opacity-70">{count}</span>
    </NavLink>
  )
  return (
    <nav className="glass-subtle flex w-fit rounded-lg p-0.5" aria-label={t('people.section')}>
      {tab('/contacts', t('nav.contacts'), contacts.length)}
      {tab('/companies', t('nav.companies'), companies.length)}
    </nav>
  )
}
