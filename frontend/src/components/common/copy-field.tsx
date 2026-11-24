import { useState } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconButton } from '@/components/common/icon-button'

/** Read-only value with copy (and optional reveal for secrets). */
export function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(!secret)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={visible ? value : '•'.repeat(24)} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        {secret && (
          <IconButton label={visible ? t('telephony.hide') : t('telephony.reveal')} variant="outline" className="size-9" onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff /> : <Eye />}
          </IconButton>
        )}
        <Button variant="outline" onClick={copy}>{copied ? <Check className="text-emerald-500" /> : <Copy />} {copied ? t('telephony.copied') : t('telephony.copy')}</Button>
      </div>
    </div>
  )
}
