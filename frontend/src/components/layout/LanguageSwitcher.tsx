import { useTranslation } from 'react-i18next'
import { Flag } from '@/components/common/flags'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LANGUAGES, setLanguage } from '@/i18n'
import { cn } from '@/lib/utils'

/** Flag-only language picker: the trigger shows the active flag, the menu lists the others. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[2]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`${t('nav.language')}: ${current.label}`}>
          <Flag code={current.code} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-0 p-1">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLanguage(l.code)}
            aria-label={l.label}
            className={cn('justify-center px-2.5', l.code === current.code && 'bg-foreground/[0.06]')}
          >
            <Flag code={l.code} className="h-5 w-[30px]" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
