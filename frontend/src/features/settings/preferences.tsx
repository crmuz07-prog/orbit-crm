import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Flag } from '@/components/common/flags'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/hooks/useTheme'
import { LANGUAGES, setLanguage, type Language } from '@/i18n'

/** Light / dark — stored on this device. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  return (
    <Tabs value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark')}>
      <TabsList aria-label={t('settings.theme')}>
        <TabsTrigger value="light"><Sun /> {t('settings.light')}</TabsTrigger>
        <TabsTrigger value="dark"><Moon /> {t('settings.dark')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

/** Interface language: flag and name (a flag alone does not say which language it is). */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <Tabs value={i18n.language} onValueChange={(v) => setLanguage(v as Language)}>
      <TabsList aria-label={t('settings.language')} className="flex-wrap">
        {LANGUAGES.map((l) => <TabsTrigger key={l.code} value={l.code} className="gap-1.5 px-3"><Flag code={l.code} /> {l.label}</TabsTrigger>)}
      </TabsList>
    </Tabs>
  )
}
