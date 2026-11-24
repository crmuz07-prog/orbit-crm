import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/common/form-fields'
import { emptyLogin, LoginFields } from '@/components/common/login-fields'
import { generatePassword, PasswordField } from '@/components/common/password-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AdminUser, Company, NewLogin, Role } from '@/lib/types'
import { RoleSelect } from '@/features/team/RoleSelect'
import { Label } from '@/components/ui/label'
import { IssueDialog } from './IssueDialog'
import type { AdminActions } from './useAdmin'

function CompanyRolePicker({ companies, companyId, onCompany, role, onRole, optional }: {
  companies: Company[]; companyId: string; onCompany: (v: string) => void; role: Role; onRole: (r: Role) => void; optional?: boolean
}) {
  const { t } = useTranslation()
  return (
    <>
      <SelectField label={t('admin.company')} emptyLabel={optional ? t('admin.noCompany') : undefined} value={companyId} onChange={onCompany}
        options={companies.map((c) => ({ value: c.id, label: c.name }))} />
      <div className="space-y-1.5"><Label>{t('team.role')}</Label><RoleSelect value={role} onChange={onRole} actorRole="owner" /></div>
    </>
  )
}

export function CreateUserDialog({ open, onOpenChange, companies, create }: { open: boolean; onOpenChange: (o: boolean) => void; companies: Company[]; create: AdminActions['createUser'] }) {
  const { t } = useTranslation()
  const [login, setLogin] = useState<NewLogin>(emptyLogin)
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [issued, setIssued] = useState<NewLogin | null>(null)

  const reset = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setLogin(emptyLogin())
      setIssued(null)
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate({ ...login, workspace_id: companyId || null, role }, { onSuccess: () => setIssued(login) })
  }

  return (
    <IssueDialog open={open} onOpenChange={reset} title={t('admin.newUser')} issued={issued}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <LoginFields value={login} onChange={setLogin} />
        <CompanyRolePicker companies={companies} companyId={companyId} onCompany={setCompanyId} role={role} onRole={setRole} optional />
        <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={create.isPending}>{t('admin.newUser')}</Button></div>
      </form>
    </IssueDialog>
  )
}

export function SetPasswordDialog({ user, onClose, setPassword }: { user: AdminUser | null; onClose: () => void; setPassword: AdminActions['setPassword'] }) {
  const { t } = useTranslation()
  const [password, setValue] = useState(generatePassword)
  const [issued, setIssued] = useState<string | null>(null)
  const close = () => {
    setIssued(null)
    setValue(generatePassword())
    onClose()
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (user) setPassword.mutate({ id: user.id, password }, { onSuccess: () => setIssued(password) })
  }
  return (
    <IssueDialog open={!!user} onOpenChange={(o) => !o && close()} title={t('team.setPassword')} description={user ? t('team.setPasswordHint', { name: user.full_name }) : undefined}
      issued={user && issued ? { email: user.email, password: issued } : null}>
      <form onSubmit={submit} className="space-y-4">
        <PasswordField label={t('team.tempPassword')} value={password} onChange={setValue} />
        <div className="flex justify-end"><Button type="submit" disabled={setPassword.isPending}>{t('team.setPassword')}</Button></div>
      </form>
    </IssueDialog>
  )
}

export function AddToCompanyDialog({ user, onClose, companies, add }: { user: AdminUser | null; onClose: () => void; companies: Company[]; add: AdminActions['addMembership'] }) {
  const { t } = useTranslation()
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState<Role>('member')
  const available = companies.filter((c) => !user?.memberships.some((m) => m.workspace_id === c.id))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (user && companyId) add.mutate({ id: user.id, workspaceId: companyId, role }, { onSuccess: onClose })
  }
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('admin.addToCompany')}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <CompanyRolePicker companies={available} companyId={companyId} onCompany={setCompanyId} role={role} onRole={setRole} />
          <div className="flex justify-end"><Button type="submit" disabled={!companyId || add.isPending}>{t('admin.addToCompany')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
