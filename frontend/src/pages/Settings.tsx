import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { Flag } from '@/components/common/flags'
import { Page } from '@/components/common/page'
import { PageSkeleton } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataCard } from '@/features/settings/DataCard'
import { StageEditor } from '@/features/settings/StageEditor'
import { TelephonyCard } from '@/features/telephony/TelephonyCard'
import { useCrm } from '@/hooks/useData'
import { useTheme } from '@/hooks/useTheme'
import { LANGUAGES, setLanguage, type Language } from '@/i18n'

function ProfileCard() {
  const { session } = useAuth()
  const { t } = useTranslation()
  if (!session) return null
  return (
    <Card>
      <CardHeader title={t('settings.profile')} />
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <PersonAvatar name={session.user.full_name} size="lg" />
        <div>
          <p className="font-medium">{session.user.full_name}</p>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <Badge tone={session.workspace.is_demo ? 'amber' : 'green'} className="ml-auto">{session.workspace.name}</Badge>
      </div>
    </Card>
  )
}

function PreferenceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.06] px-5 py-4 first-of-type:border-t-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function AppearanceCard() {
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
            {LANGUAGES.map((l) => <TabsTrigger key={l.code} value={l.code} aria-label={l.label} className="px-3"><Flag code={l.code} /></TabsTrigger>)}
          </TabsList>
        </Tabs>
      </PreferenceRow>
    </Card>
  )
}

export default function SettingsPage() {
  const { isLoading } = useCrm()
  const { t } = useTranslation()
  if (isLoading) return <PageSkeleton />
  return (
    <Page title={t('settings.title')} description={t('settings.description')}>
      <div className="grid max-w-4xl gap-5">
        <ProfileCard />
        <AppearanceCard />
        <TelephonyCard />
        <StageEditor />
        <DataCard />
      </div>
    </Page>
  )
}
