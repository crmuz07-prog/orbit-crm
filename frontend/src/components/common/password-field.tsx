import { useState } from 'react'
import { Eye, EyeOff, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// No look-alike characters (0/O, 1/l/I) so a password read out loud or copied by hand works first time.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePassword(length = 12) {
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Temporary-password input with show/hide and a generator, used wherever an admin issues a login. */
export function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const generate = () => {
    onChange(generatePassword())
    setVisible(true)
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input type={visible ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
        <Button variant="outline" size="icon" className="size-9" onClick={() => setVisible((v) => !v)} aria-label={visible ? t('telephony.hide') : t('telephony.reveal')}>
          {visible ? <EyeOff /> : <Eye />}
        </Button>
        <Button variant="outline" onClick={generate}><Wand2 /> {t('team.generate')}</Button>
      </div>
    </div>
  )
}
