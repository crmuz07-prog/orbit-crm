import { Building2, CalendarCheck, Handshake, Menu, Moon, Phone, Plus, Search, Sun, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { ReminderBell } from '@/features/reminders/ReminderBell'
import { useTheme } from '@/hooks/useTheme'
import { LanguageSwitcher } from './LanguageSwitcher'
import { IconButton } from '@/components/common/icon-button'

const CREATE_ITEMS = [
  { kind: 'deal', icon: Handshake },
  { kind: 'company', icon: Building2 },
  { kind: 'contact', icon: Users },
  { kind: 'call', icon: Phone },
  { kind: 'activity', icon: CalendarCheck },
] as const

function NewMenu() {
  const openModal = useEntityModal()
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button><Plus /> 
         {/* <ChevronDown className="opacity-70" /> */}
         </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t('nav.create')}</DropdownMenuLabel>
        {CREATE_ITEMS.map(({ kind, icon: Icon }) => (
          <DropdownMenuItem key={kind} onSelect={() => openModal({ kind })}><Icon /> {t(`dialog.new.${kind}`)}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** One top bar for everyone; record search, quick-create and reminders exist only inside a company. */
export function Topbar({ onOpenNav, onOpenPalette, inWorkspace }: { onOpenNav: () => void; onOpenPalette: () => void; inWorkspace: boolean }) {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()
  return (
    <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
      <IconButton label={t('nav.openMenu')} className="lg:hidden" onClick={onOpenNav}><Menu /></IconButton>
      {inWorkspace && <button
        onClick={onOpenPalette}
        className="glass-subtle flex h-9 w-full max-w-md items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">{t('nav.search')}</span>
        <kbd className="hidden rounded border px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </button>}
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        {inWorkspace && <ReminderBell />}
        <IconButton label={t('nav.darkMode')} onClick={toggle}>{theme === 'dark' ? <Sun /> : <Moon />}</IconButton>
        {inWorkspace && <NewMenu />}
      </div>
    </header>
  )
}
