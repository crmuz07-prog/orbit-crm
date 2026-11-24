import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWorkspaceSession } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { Flag } from '@/components/common/flags'
import { Page } from '@/components/common/page'
import { PageLoading } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccessRolesCard } from '@/features/access/AccessRolesCard'
import { SalesTeamsCard } from '@/features/access/SalesTeamsCard'
import { useAccessConfig } from '@/features/access/useAccessConfig'
import { AccountCard } from '@/features/settings/AccountCard'
import { DataCard } from '@/features/settings/DataCard'
import { StageEditor } from '@/features/settings/StageEditor'
import { InstagramCard } from '@/features/instagram/InstagramCard'
import { TeamCard } from '@/features/team/TeamCard'
import { TelephonyCard } from '@/features/telephony/TelephonyCard'
import { useCrm } from '@/hooks/useData'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useTheme } from '@/hooks/useTheme'
import { LANGUAGES, setLanguage, type Language } from '@/i18n'

function ProfileCard() {
  const session = useWorkspaceSession()
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader title={t('settings.profile')} />
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <PersonAvatar name={session.user.full_name} size="lg" />
        <div>
          <p className="font-medium">{session.user.full_name}</p>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge tone={session.workspace.is_demo ? 'amber' : 'green'}>{session.workspace.name}</Badge>
          <Badge tone="violet">{t(`roles.${session.role}`)}</Badge>
        </div>
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

const TABS = ['account', 'team', 'workspace'] as const
type Tab = (typeof TABS)[number]

/** Team & access: everyone sees the team; owners and admins also manage roles and sales teams. */
function TeamTab({ isAdmin }: { isAdmin: boolean }) {
  const access = useAccessConfig(isAdmin)
  return (
    <>
      <TeamCard access={isAdmin ? access.config : undefined} />
      {isAdmin && <AccessRolesCard actions={access} />}
      {isAdmin && <SalesTeamsCard actions={access} />}
    </>
  )
}

export default function SettingsPage() {
  const { isLoading } = useCrm()
  const { t } = useTranslation()
  const session = useWorkspaceSession()
  const [tab, setTab] = usePersistentState<Tab>('orbit:settings-tab', 'account', TABS)
  // Workspace configuration is for owners and admins only (mirrors the API).
  const isAdmin = session.role !== 'member'
  if (isLoading) return <PageLoading title={t('settings.title')} description={t('settings.description')} />
  return (
    <Page title={t('settings.title')} description={t('settings.description')}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="max-w-4xl">
        <TabsList className="mb-5">
          {TABS.filter((v) => v !== 'workspace' || isAdmin || session.workspace.is_demo).map((v) => (
            <TabsTrigger key={v} value={v}>{t(`settingsTabs.${v}`)}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="account" className="grid gap-5">
          <ProfileCard />
          <AccountCard />
          <AppearanceCard />
        </TabsContent>
        <TabsContent value="team" className="grid gap-5"><TeamTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="workspace" className="grid gap-5">
          {isAdmin && <TelephonyCard />}
          {isAdmin && <InstagramCard />}
          {isAdmin && <StageEditor />}
          <DataCard />
        </TabsContent>
      </Tabs>
    </Page>
  )
}
