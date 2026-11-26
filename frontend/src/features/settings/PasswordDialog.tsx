import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { useFormErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/api'
import { MIN_PASSWORD, newPassword, rules } from '@/lib/validation'

function PasswordForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const { session, signIn } = useAuth()
  const errors = useFormErrors<'current' | 'next'>('password-form')
  const { busy, run } = useAsyncAction((err) => errors.fromApi(err, { new_password: 'next', current_password: 'current' }, { code: 'wrong_password', field: 'current' }))
  const hasPassword = session?.user.has_password ?? true
  const [current, setCurrentValue] = useState('')
  const [next, setNextValue] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!errors.validate({ current, next }, { ...(hasPassword ? { current: [rules.required()] } : {}), next: newPassword() })) return
    // Other devices are signed out; this one continues with the fresh token.
    const token = await run(() => authApi.changePassword(hasPassword ? current : null, next))
    if (!token) return
    signIn(token)
    toast.success(t('account.passwordChanged'))
    onDone()
  }

  return (
    <form id="password-form" onSubmit={submit} noValidate className="space-y-3">
      {hasPassword && <TextField name="current" label={t('account.currentPassword')} type="password" autoComplete="current-password" autoFocus value={current} onChange={errors.bind('current', setCurrentValue)} error={errors.message('current')} />}
      <TextField name="next" label={t('account.newPassword')} type="password" autoComplete="new-password" autoFocus={!hasPassword} value={next} onChange={errors.bind('next', setNextValue)} error={errors.message('next')} />
      <p className="text-xs text-muted-foreground">{t('setup.profile.passwordHint', { min: MIN_PASSWORD })}</p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={busy || !next}>{hasPassword ? t('account.changePassword') : t('account.setFirstPassword')}</Button>
      </DialogFooter>
    </form>
  )
}

/** "Change password" in the profile: the form in a dialog, so the page itself stays a calm list of settings. */
export function PasswordDialog() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const hasPassword = session?.user.has_password ?? true
  const label = hasPassword ? t('account.changePassword') : t('account.setFirstPassword')
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{t('setup.securityDesc')}</DialogDescription>
          </DialogHeader>
          {/* Remounted on each open: no password stays in the fields afterwards. */}
          {open && <PasswordForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
