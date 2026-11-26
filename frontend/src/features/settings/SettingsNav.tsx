import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { GROUPS, type Section, type SectionId } from './sections'

interface Props {
  sections: Section[]
  current: SectionId
  onSelect: (id: SectionId) => void
}

/** The settings sections, grouped (Personal · Team · Sales · Integrations · Data) — shown in the right-hand panel. */
export function SettingsNav({ sections, current, onSelect }: Props) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('setup.navLabel')} className="space-y-3">
      {GROUPS.map((group) => {
        const items = sections.filter((s) => s.group === group)
        if (items.length === 0) return null
        return (
          <div key={group} className="space-y-0.5">
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(`setup.groups.${group}`)}</p>
            {items.map((s) => {
              const Icon = s.icon
              const active = s.id === current
              return (
                <button key={s.id} type="button" onClick={() => onSelect(s.id)} aria-current={active ? 'page' : undefined}
                  className={cn('flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'bg-primary/15 font-medium text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground')}>
                  <Icon className={cn('size-4 shrink-0', active && 'text-primary')} />
                  <span className="truncate">{t(`setup.nav.${s.id}`)}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
