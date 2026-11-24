import { useTranslation } from 'react-i18next'
import type { NewLogin } from '@/lib/types'
import { newPassword, rules } from '@/lib/validation'
import { TextField } from './form-fields'
import { PasswordField, generatePassword } from './password-field'

export const emptyLogin = (): NewLogin => ({ full_name: '', email: '', password: generatePassword() })

/** The rules every admin-issued login follows (the same the API enforces). */
export const LOGIN_RULES = { full_name: [rules.required()], email: [rules.required(), rules.email()], password: newPassword() }

type LoginErrors = Partial<Record<keyof NewLogin, string>>

/** Name + login + temporary password: the three fields of every admin-issued account. */
export function LoginFields({ value, onChange, errors = {}, onEdit }: { value: NewLogin; onChange: (v: NewLogin) => void; errors?: LoginErrors; onEdit?: (field: keyof NewLogin) => void }) {
  const { t } = useTranslation()
  const set = (key: keyof NewLogin) => (v: string) => {
    onChange({ ...value, [key]: v })
    onEdit?.(key)
  }
  return (
    <>
      <TextField name="full_name" label={t('team.fullName')} value={value.full_name} onChange={set('full_name')} error={errors.full_name} />
      <TextField name="email" label={t('team.email')} type="email" value={value.email} onChange={set('email')} error={errors.email} placeholder={t('examples.email')} />
      <PasswordField label={t('team.tempPassword')} value={value.password} onChange={set('password')} error={errors.password} />
    </>
  )
}
