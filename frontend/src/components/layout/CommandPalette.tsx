import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CalendarCheck, Handshake, LayoutDashboard, Phone, Plus, Settings, Users, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { fullName, money } from '@/lib/utils'

const PAGES: ['dashboard' | 'deals' | 'companies' | 'contacts' | 'calls' | 'activities' | 'settings', string, LucideIcon][] = [
  ['dashboard', '/', LayoutDashboard],
  ['deals', '/deals', Handshake],
  ['companies', '/companies', Building2],
  ['contacts', '/contacts', Users],
  ['calls', '/calls', Phone],
  ['activities', '/activities', CalendarCheck],
  ['settings', '/settings', Settings],
]

type Entry = { key: string; value: string; icon: ReactNode; label: string; hint?: string; run: () => void }

function useEntries(): { heading: string; entries: Entry[] }[] {
  const navigate = useNavigate()
  const openModal = useEntityModal()
  const { deals, companies, contacts, companyById } = useCrm()
  const { t } = useTranslation()
  const go = (to: string) => () => navigate(to)
  return [
    { heading: t('palette.create'), entries: (['deal', 'company', 'contact', 'call', 'activity'] as const).map((kind) => ({ key: kind, value: `create ${kind} ${t(`dialog.new.${kind}`)}`, icon: kind === 'call' ? <Phone /> : <Plus />, label: t(`dialog.new.${kind}`), run: () => openModal({ kind }) })) },
    { heading: t('palette.goTo'), entries: PAGES.map(([key, to, Icon]) => ({ key: to, value: `go ${key} ${t(`nav.${key}`)}`, icon: <Icon />, label: t(`nav.${key}`), run: go(to) })) },
    { heading: t('palette.deals'), entries: deals.map((d) => ({ key: d.id, value: `deal ${d.title} ${d.id}`, icon: <Handshake />, label: d.title, hint: money(d.amount, d.currency, true), run: go(`/deals/${d.id}`) })) },
    { heading: t('palette.companies'), entries: companies.map((c) => ({ key: c.id, value: `company ${c.name} ${c.domain ?? ''} ${c.id}`, icon: <CompanyLogo name={c.name} size="xs" />, label: c.name, hint: c.domain ?? undefined, run: go(`/companies/${c.id}`) })) },
    {
      heading: t('palette.contacts'),
      entries: contacts.map((c) => ({
        key: c.id, value: `contact ${fullName(c)} ${c.email ?? ''} ${c.id}`, icon: <PersonAvatar name={fullName(c)} size="xs" />, label: fullName(c),
        hint: (c.company_id && companyById.get(c.company_id)?.name) || c.email || undefined, run: go(`/contacts/${c.id}`),
      })),
    },
  ]
}

/** Attio / Linear-style ⌘K: create anything, jump anywhere. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const groups = useEntries()
  const { t } = useTranslation()
  const select = (run: () => void) => () => {
    onOpenChange(false)
    run()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose aria-describedby={undefined} className="max-w-xl overflow-hidden p-0">
        <DialogTitle className="sr-only">{t('nav.search')}</DialogTitle>
        <Command>
          <CommandInput autoFocus placeholder={t('palette.placeholder')} />
          <CommandList>
            <CommandEmpty>{t('common.noResults')}</CommandEmpty>
            {groups.map(({ heading, entries }) => (
              <CommandGroup key={heading} heading={heading}>
                {entries.map((e) => (
                  <CommandItem key={e.key} value={e.value} onSelect={select(e.run)}>
                    {e.icon}
                    <span className="flex-1 truncate">{e.label}</span>
                    {e.hint && <span className="text-xs text-muted-foreground">{e.hint}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="flex gap-4 border-t border-foreground/[0.06] px-4 py-2 text-[11px] text-muted-foreground">
            <span>{t('palette.navigate')}</span><span>{t('palette.open')}</span><span>{t('palette.close')}</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
