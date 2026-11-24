import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CredentialsCard } from '@/components/common/credentials-card'
import { emptyLogin, LOGIN_RULES, LoginFields } from '@/components/common/login-fields'
import { useFormErrors } from '@/hooks/useFormErrors'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { NewLogin, Role } from '@/lib/types'
import { RoleSelect } from './RoleSelect'
import type { TeamActions } from './useTeam'

/** ERP-style provisioning: the admin creates the login and hands over a temporary password. */
export function AddMemberForm({ add, actorRole }: { add: TeamActions['add']; actorRole: Role }) {
  const { t } = useTranslation()
  const [login, setLogin] = useState<NewLogin>(emptyLogin)
  const [role, setRole] = useState<Role>('member')
  const [issued, setIssued] = useState<NewLogin | null>(null)
  const errors = useFormErrors<keyof NewLogin>('add-member-form')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate(login, LOGIN_RULES)) return
    add.mutate({ ...login, role }, {
      onError: (err) => errors.fromApi(err),
      // An existing account keeps its own password, so there are no credentials to hand over.
      onSuccess: (result) => {
        setIssued(result.account_created ? login : null)
        setLogin(emptyLogin())
      },
    })
  }

  return (
    <div className="space-y-4">
      <form id="add-member-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <LoginFields value={login} onChange={setLogin} onEdit={errors.clear}
          errors={{ full_name: errors.message('full_name'), email: errors.message('email'), password: errors.message('password') }} />
        <div className="space-y-1.5">
          <Label>{t('team.role')}</Label>
          <RoleSelect value={role} onChange={setRole} actorRole={actorRole} />
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={add.isPending}><UserPlus /> {t('team.addUser')}</Button>
        </div>
      </form>
      <AnimatePresence>
        {issued && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <CredentialsCard email={issued.email} password={issued.password} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
