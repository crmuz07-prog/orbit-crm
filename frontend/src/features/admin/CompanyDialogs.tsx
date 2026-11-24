import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { emptyLogin, LoginFields } from '@/components/common/login-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Company, NewLogin } from '@/lib/types'
import { IssueDialog } from './IssueDialog'
import type { AdminActions } from './useAdmin'

/** New company = workspace + default pipeline + an owner login handed over once. */
export function CreateCompanyDialog({ open, onOpenChange, create }: { open: boolean; onOpenChange: (o: boolean) => void; create: AdminActions['createCompany'] }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [owner, setOwner] = useState<NewLogin>(emptyLogin)
  const [issued, setIssued] = useState<NewLogin | null>(null)

  const reset = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setName('')
      setOwner(emptyLogin())
      setIssued(null)
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate({ name: name.trim(), owner }, { onSuccess: () => setIssued(owner) })
  }

  return (
    <IssueDialog open={open} onOpenChange={reset} title={t('admin.newCompany')} issued={issued}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <TextField wide label={t('admin.companyName')} required autoFocus value={name} onChange={setName} />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:col-span-2">{t('admin.owner')}</p>
        <LoginFields value={owner} onChange={setOwner} />
        <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={create.isPending}>{t('admin.newCompany')}</Button></div>
      </form>
    </IssueDialog>
  )
}

function RenameForm({ company, onDone, rename }: { company: Company; onDone: () => void; rename: AdminActions['renameCompany'] }) {
  const { t } = useTranslation()
  const [name, setName] = useState(company.name)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    rename.mutate({ id: company.id, name: name.trim() }, { onSuccess: onDone })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField label={t('admin.companyName')} required autoFocus value={name} onChange={setName} />
      <div className="flex justify-end"><Button type="submit" disabled={rename.isPending}>{t('common.save')}</Button></div>
    </form>
  )
}

export function RenameCompanyDialog({ company, onClose, rename }: { company: Company | null; onClose: () => void; rename: AdminActions['renameCompany'] }) {
  const { t } = useTranslation()
  return (
    <Dialog open={!!company} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('admin.rename')}</DialogTitle></DialogHeader>
        {company && <RenameForm key={company.id} company={company} onDone={onClose} rename={rename} />}
      </DialogContent>
    </Dialog>
  )
}
