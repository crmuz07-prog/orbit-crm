import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initial?: string
  submitLabel: string
  onSubmit: (name: string) => void
}

/** Ask for a pipeline name — for a new pipeline and for renaming; Enter submits, Esc closes. */
export function PipelineNameDialog({ open, onOpenChange, title, description, initial = '', submitLabel, onSubmit }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial)
  const trimmed = name.trim()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed || trimmed === initial) return
    onSubmit(trimmed)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-name">{t('setup.pipe.name')}</Label>
            <Input id="pipeline-name" autoFocus value={name} maxLength={120} placeholder={t('setup.pipe.namePh')} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!trimmed || trimmed === initial}>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
