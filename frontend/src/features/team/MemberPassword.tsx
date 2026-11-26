import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CredentialsCard } from '@/components/common/credentials-card'
import { PasswordField, generatePassword } from '@/components/common/password-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFormErrors } from '@/hooks/useFormErrors'
import type { TeamMember } from '@/lib/types'
import { newPassword } from '@/lib/validation'
import type { TeamActions } from './useTeam'

/** Admin issues a temporary password; the member must replace it at the next sign-in. */
export function SetPasswordButton({ member, setPassword }: { member: TeamMember; setPassword: TeamActions['setPassword'] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [password, setValue] = useState('')
  const [issued, setIssued] = useState<string | null>(null)
  const errors = useFormErrors<'password'>('member-password-form')

  const show = () => {
    setValue(generatePassword())
    setIssued(null)
    setOpen(true)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ password }, { password: newPassword() })) return
    setPassword.mutate({ userId: member.user_id, password }, { onSuccess: () => setIssued(password), onError: (err) => errors.fromApi(err) })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={show}><KeyRound /> {t('team.setPassword')}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('team.setPassword')}</DialogTitle>
            <DialogDescription>{t('team.setPasswordHint', { name: member.full_name })}</DialogDescription>
          </DialogHeader>
          {issued ? <CredentialsCard email={member.email} password={issued} /> : (
            <form id="member-password-form" onSubmit={submit} noValidate className="space-y-3">
              <PasswordField label={t('team.tempPassword')} value={password} onChange={errors.bind('password', setValue)} error={errors.message('password')} />
              <div className="flex justify-end"><Button type="submit" disabled={setPassword.isPending}>{t('team.setPassword')}</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
