import { useState } from 'react'
import { FileUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/common/icon-button'
import { useWorkspaceSession } from '@/auth/AuthProvider'
import { ImportDialog } from './ImportDialog'

/** Owners and admins import deals (mirrors the API). */
export function ImportButton() {
  const { t } = useTranslation()
  const session = useWorkspaceSession()
  const [open, setOpen] = useState(false)
  if (session.role === 'member') return null
  return (
    <>
      <IconButton label={t('importer.title')} variant="outline" className="size-9" onClick={() => setOpen(true)}><FileUp /></IconButton>
      <ImportDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
