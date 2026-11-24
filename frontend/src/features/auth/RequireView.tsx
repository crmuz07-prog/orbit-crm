import type { ReactNode } from 'react'
import { ShieldOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { useAccess } from '@/hooks/useAccess'
import type { Module } from '@/lib/types'

/** Pages of a module the caller can't view explain why instead of showing empty lists. */
export function RequireView({ module, children }: { module: Module | null; children: ReactNode }) {
  const { t } = useTranslation()
  const { can } = useAccess()
  if (can(module, 'view')) return children
  return <Card><EmptyState icon={ShieldOff} title={t('noAccess.title')} description={t('noAccess.desc')} /></Card>
}
