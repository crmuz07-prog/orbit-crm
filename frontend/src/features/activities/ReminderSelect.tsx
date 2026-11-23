import { useTranslation } from 'react-i18next'
import { SelectBox, SelectField } from '@/components/common/form-fields'
import { REMINDER_OPTIONS } from '@/lib/constants'
import type { ReminderKey } from '@/lib/reminders'

/** "Remind me" picker shared by the activity form, the composer and the call follow-up. */
export function ReminderSelect({ value, onChange, label, className }: { value: ReminderKey; onChange: (k: ReminderKey) => void; label?: string; className?: string }) {
  const { t } = useTranslation()
  const options = REMINDER_OPTIONS.map((o) => ({ value: o.key, label: t(`reminder.${o.key}`) }))
  const props = { value, onChange: (v: string) => onChange((v || 'none') as ReminderKey), options, className }
  return label ? <SelectField label={label} {...props} /> : <SelectBox {...props} />
}
