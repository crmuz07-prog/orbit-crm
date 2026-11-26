import type { ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Flag } from '@/components/common/flags'
import { Card, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/hooks/useTheme'
import { LANGUAGES, setLanguage, type Language } from '@/i18n'

function PreferenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.06] px-4 py-3 first-of-type:border-t-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

/** Theme and interface language — stored on this device. */
export function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()
  return (
    <Card>
      <CardHeader title={t('settings.appearance')} />
      <PreferenceRow label={t('settings.theme')}>
        <Tabs value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark')}>
          <TabsList>
            <TabsTrigger value="light"><Sun /> {t('settings.light')}</TabsTrigger>
            <TabsTrigger value="dark"><Moon /> {t('settings.dark')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </PreferenceRow>
      <PreferenceRow label={t('settings.language')}>
        <Tabs value={i18n.language} onValueChange={(v) => setLanguage(v as Language)}>
          <TabsList>
            {/* Flag and name: a flag alone does not say which language it is. */}
            {LANGUAGES.map((l) => <TabsTrigger key={l.code} value={l.code} className="gap-1.5 px-3"><Flag code={l.code} /> {l.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </PreferenceRow>
    </Card>
  )
}
