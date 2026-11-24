import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/components/common/confirm-provider'
import type { TeamMember } from '@/lib/types'
import type { TeamActions } from './useTeam'

/** Role, access role and sales team decide what a person sees and may do: every change is confirmed first. */
export function useMemberChange(member: TeamMember, update: TeamActions['update']) {
  const { t } = useTranslation()
  const confirm = useConfirm()
  return async (patch: Partial<TeamMember>, what: string, value: string) => {
    const ok = await confirm({ title: t('confirm.member.title', { name: member.full_name, what, value }), description: t('confirm.member.desc'),
      confirmLabel: t('confirm.member.action'), tone: 'default' })
    if (ok) update.mutate({ userId: member.user_id, patch })
  }
}
