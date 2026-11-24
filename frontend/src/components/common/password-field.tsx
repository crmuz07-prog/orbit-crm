import { useId, useState } from 'react'
import { Eye, EyeOff, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { errorProps, FieldError } from './form-fields'

// No look-alike characters (0/O, 1/l/I) so a password read out loud or copied by hand works first time.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePassword(length = 12) {
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Temporary-password input with show/hide and a generator, used wherever an admin issues a login. */
export function PasswordField({ label, value, onChange, name = 'password', error }: { label: string; value: string; onChange: (v: string) => void; name?: string; error?: string }) {
  const { t } = useTranslation()
  const id = useId()
  const invalid = errorProps(id, error)
  const [visible, setVisible] = useState(false)
  const generate = () => {
    onChange(generatePassword())
    setVisible(true)
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input name={name} type={visible ? 'text' : 'password'} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} {...invalid} className={cn('font-mono', invalid.className)} />
        <Button variant="outline" size="icon" className="size-9" onClick={() => setVisible((v) => !v)} aria-label={visible ? t('telephony.hide') : t('telephony.reveal')}>
          {visible ? <EyeOff /> : <Eye />}
        </Button>
        <Button variant="outline" onClick={generate}><Wand2 /> {t('team.generate')}</Button>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}
