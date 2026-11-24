import { useState } from 'react'
import { FileUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><FileUp /> {t('importer.button')}</Button>
      <ImportDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
