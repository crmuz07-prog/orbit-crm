import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkspaceSession } from '@/auth/AuthProvider'
import { Page } from '@/components/common/page'
import { PageLoading } from '@/components/common/states'
import { SECTIONS, type SectionId } from '@/features/settings/sections'
import { SettingsNav } from '@/features/settings/SettingsNav'
import { useCrm } from '@/hooks/useData'

/** Settings: a grouped menu and one section at a time; the open section lives in the URL (`?s=pipelines`). */
export default function SettingsPage() {
  const { isLoading } = useCrm()
  const { t } = useTranslation()
  const session = useWorkspaceSession()
  const [params, setParams] = useSearchParams()
  // Workspace configuration is for owners and admins only (mirrors the API); the demo lets everyone look around.
  const isAdmin = session.role !== 'member'
  const sections = SECTIONS.filter((s) => !s.admin || isAdmin || session.workspace.is_demo)
  const current = sections.find((s) => s.id === params.get('s')) ?? sections[0]
  const select = (id: SectionId) => setParams({ s: id }, { replace: true })

  if (isLoading) return <PageLoading title={t('settings.title')} description={t('settings.description')} />
  return (
    <Page title={t('settings.title')} description={t('settings.description')}>
      <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-[calc(3.5rem_+_var(--gutter))]">
          <SettingsNav sections={sections} current={current.id} onSelect={select} />
        </div>
        <div key={current.id} className="grid min-w-0 max-w-4xl gap-3">{current.render(isAdmin)}</div>
      </div>
    </Page>
  )
}
