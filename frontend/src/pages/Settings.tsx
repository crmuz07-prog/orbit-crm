import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PanelRight, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useWorkspaceSession } from '@/auth/AuthProvider'
import { IconButton } from '@/components/common/icon-button'
import { Page } from '@/components/common/page'
import { PageLoading } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SECTIONS, type SectionId } from '@/features/settings/sections'
import { SettingsNav } from '@/features/settings/SettingsNav'
import { useCrm } from '@/hooks/useData'
import { usePersistentState } from '@/hooks/usePersistentState'

const PANEL = ['open', 'closed'] as const

/**
 * Settings: one section at a time, the section menu on the right. From `lg` it is a panel beside the content that can be
 * folded away (remembered); on smaller screens it slides in from the right. The open section lives in the URL (`?s=`).
 */
export default function SettingsPage() {
  const { isLoading } = useCrm()
  const { t } = useTranslation()
  const session = useWorkspaceSession()
  const [params, setParams] = useSearchParams()
  const [panel, setPanel] = usePersistentState('orbit:settings-panel', 'open', PANEL)
  const [drawer, setDrawer] = useState(false)
  // Workspace configuration is for owners and admins only (mirrors the API); the demo lets everyone look around.
  const isAdmin = session.role !== 'member'
  const sections = SECTIONS.filter((s) => !s.admin || isAdmin || session.workspace.is_demo)
  const current = sections.find((s) => s.id === params.get('s')) ?? sections[0]
  const select = (id: SectionId) => {
    setParams({ s: id }, { replace: true })
    setDrawer(false)
  }
  const open = panel === 'open'

  if (isLoading) return <PageLoading title={t('settings.title')} description={t('settings.description')} />
  const actions = (
    <>
      <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}><PanelRight /> {t(`setup.nav.${current.id}`)}</Button>
      <IconButton label={t(open ? 'setup.hideSections' : 'setup.showSections')} variant="outline" className="hidden size-9 lg:inline-flex"
        onClick={() => setPanel(open ? 'closed' : 'open')}>
        {open ? <PanelRightClose /> : <PanelRightOpen />}
      </IconButton>
    </>
  )
  return (
    <Page title={t('settings.title')} description={t('settings.description')} actions={actions}>
      <div className={open ? 'grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-start' : 'grid gap-3'}>
        <div key={current.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">{current.render(isAdmin)}</div>
        {open && (
          <aside className="hidden lg:sticky lg:top-[calc(3.5rem_+_var(--gutter))] lg:block">
            <SettingsNav sections={sections} current={current.id} onSelect={select} />
          </aside>
        )}
      </div>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="right" className="overflow-y-auto p-3">
          <SheetTitle className="mb-3 px-2.5 text-sm font-semibold">{t('settings.title')}</SheetTitle>
          <SettingsNav sections={sections} current={current.id} onSelect={select} />
        </SheetContent>
      </Sheet>
    </Page>
  )
}
