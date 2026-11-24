import { useTranslation } from 'react-i18next'
import type { NewLogin } from '@/lib/types'
import { TextField } from './form-fields'
import { PasswordField, generatePassword } from './password-field'

export const emptyLogin = (): NewLogin => ({ full_name: '', email: '', password: generatePassword() })

/** Name + login + temporary password: the three fields of every admin-issued account. */
export function LoginFields({ value, onChange }: { value: NewLogin; onChange: (v: NewLogin) => void }) {
  const { t } = useTranslation()
  const set = (key: keyof NewLogin) => (v: string) => onChange({ ...value, [key]: v })
  return (
    <>
      <TextField label={t('team.fullName')} required value={value.full_name} onChange={set('full_name')} />
      <TextField label={t('team.email')} type="email" required value={value.email} onChange={set('email')} placeholder={t('examples.email')} />
      <PasswordField label={t('team.tempPassword')} value={value.password} onChange={set('password')} />
    </>
  )
}
