import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { emptyLogin, LOGIN_RULES, LoginFields } from '@/components/common/login-fields'
import { useFormErrors } from '@/hooks/useFormErrors'
import { rules } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PlatformCompany, NewLogin } from '@/lib/types'
import { IssueDialog } from './IssueDialog'
import type { AdminActions } from './useAdmin'

/** New company = workspace + default pipeline + an owner login handed over once. */
export function CreateCompanyDialog({ open, onOpenChange, create }: { open: boolean; onOpenChange: (o: boolean) => void; create: AdminActions['createCompany'] }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [owner, setOwner] = useState<NewLogin>(emptyLogin)
  const [issued, setIssued] = useState<NewLogin | null>(null)
  const errors = useFormErrors<'name' | keyof NewLogin>('new-company-form')

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
    if (!errors.validate({ name, ...owner }, { name: [rules.required()], ...LOGIN_RULES })) return
    create.mutate({ name: name.trim(), owner }, { onSuccess: () => setIssued(owner), onError: (err) => errors.fromApi(err) })
  }

  return (
    <IssueDialog open={open} onOpenChange={reset} title={t('admin.newCompany')} issued={issued} dirty={!!(name.trim() || owner.full_name.trim() || owner.email.trim())}>
      <form id="new-company-form" onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
        <TextField wide name="name" label={t('admin.companyName')} autoFocus value={name} onChange={errors.bind('name', setName)} error={errors.message('name')} />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:col-span-2">{t('admin.owner')}</p>
        <LoginFields value={owner} onChange={setOwner} onEdit={errors.clear}
          errors={{ full_name: errors.message('full_name'), email: errors.message('email'), password: errors.message('password') }} />
        <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={create.isPending}>{t('admin.newCompany')}</Button></div>
      </form>
    </IssueDialog>
  )
}

function RenameForm({ company, onDone, rename }: { company: PlatformCompany; onDone: () => void; rename: AdminActions['renameCompany'] }) {
  const { t } = useTranslation()
  const [name, setName] = useState(company.name)
  const errors = useFormErrors<'name'>('rename-company-form')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ name }, { name: [rules.required()] })) return
    rename.mutate({ id: company.id, name: name.trim() }, { onSuccess: onDone })
  }
  return (
    <form id="rename-company-form" onSubmit={submit} noValidate className="space-y-3">
      <TextField name="name" label={t('admin.companyName')} autoFocus value={name} onChange={errors.bind('name', setName)} error={errors.message('name')} />
      <div className="flex justify-end"><Button type="submit" disabled={rename.isPending}>{t('common.save')}</Button></div>
    </form>
  )
}

export function RenameCompanyDialog({ company, onClose, rename }: { company: PlatformCompany | null; onClose: () => void; rename: AdminActions['renameCompany'] }) {
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
