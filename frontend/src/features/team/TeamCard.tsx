import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AccessOverview } from '@/lib/types'
import { AddMemberDialog } from './AddMemberForm'
import { MEMBER_GRID, MemberRow } from './MemberRow'
import { cn } from '@/lib/utils'
import { useTeam } from './useTeam'

/** Settings → Team: members with roles; admins issue logins (HubSpot / ERP-style user management). */
export function TeamCard({ access }: { access?: AccessOverview }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { team, add, update, remove, setPassword } = useTeam()
  if (!session?.workspace || !session.role) return null
  if (!team) return <Skeleton className="h-64 rounded-2xl" />

  // Paid seats (set by the platform operator); counted from the live list so it updates as people are added.
  const limit = session.workspace.seat_limit
  const used = team.members.filter((m) => m.is_active).length
  const seats = limit != null && <Badge tone={used >= limit ? 'amber' : 'gray'}>{t('billing.teamSeats', { used, limit })}</Badge>
  const hint = session.workspace.is_demo ? t('team.demoReadOnly') : !team.can_manage ? t('team.readOnly') : null
  const action = (
    <div className="flex flex-wrap items-center gap-2">
      {seats}
      {team.can_manage && <AddMemberDialog add={add} actorRole={session.role} />}
    </div>
  )
  return (
    <Card>
      <CardHeader title={t('team.title')} description={t('team.description')} action={action} />
      <div className={cn(MEMBER_GRID, 'hidden border-b border-foreground/[0.06] px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid')}>
        <span>{t('setup.nav.members')}</span>
        <span>{t('setup.members.role')}</span>
        <span>{t('setup.members.access')}</span>
        <span>{t('setup.members.team')}</span>
        <span />
      </div>
      <ul className="divide-y divide-foreground/[0.06]">
        {team.members.map((m) => (
          <MemberRow key={m.user_id} member={m} isSelf={m.user_id === session.user.id} canManage={team.can_manage} actorRole={session.role!} actions={{ update, remove, setPassword }} access={access} />
        ))}
      </ul>
      {hint && <p className="px-4 py-3 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
