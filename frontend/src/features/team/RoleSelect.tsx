import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import type { Role } from '@/lib/types'

const ROLES: Role[] = ['owner', 'admin', 'member']

/** Only owners may hand out ownership (mirrors the API rule). */
export function RoleSelect({ value, onChange, actorRole, className }: { value: Role; onChange: (r: Role) => void; actorRole: Role; className?: string }) {
  const { t } = useTranslation()
  const options = ROLES.filter((r) => r !== 'owner' || actorRole === 'owner').map((r) => ({ value: r, label: t(`roles.${r}`) }))
  return <SelectBox value={value} onChange={(v) => onChange(v as Role)} options={options} className={className} />
}
