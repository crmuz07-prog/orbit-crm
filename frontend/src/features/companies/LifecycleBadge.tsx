import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { LIFECYCLES } from '@/lib/constants'
import type { Lifecycle } from '@/lib/types'

export function LifecycleBadge({ value }: { value: Lifecycle }) {
  const { t } = useTranslation()
  const lifecycle = LIFECYCLES.find((l) => l.value === value) ?? LIFECYCLES[0]
  return <Badge tone={lifecycle.tone}>{t(`enums.lifecycle.${lifecycle.value}`)}</Badge>
}
