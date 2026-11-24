import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddMemberForm } from './AddMemberForm'
import { MemberRow } from './MemberRow'
import { useTeam } from './useTeam'
import type { AccessOverview } from '@/lib/types'

/** Settings → Team: members with roles; admins issue logins (HubSpot / ERP-style user management). */
export function TeamCard({ access }: { access?: AccessOverview }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { team, add, update, remove, setPassword } = useTeam()
  if (!session?.workspace || !session.role) return null
  if (!team) return <Skeleton className="h-64 rounded-2xl" />

  const hint = session.workspace.is_demo ? t('team.demoReadOnly') : !team.can_manage ? t('team.readOnly') : null
  return (
    <Card>
      <CardHeader title={t('team.title')} description={t('team.description')} />
      {team.can_manage && (
        <CardContent className="border-b border-foreground/[0.06]">
          <AddMemberForm add={add} actorRole={session.role} />
        </CardContent>
      )}
      <ul className="divide-y divide-foreground/[0.06]">
        {team.members.map((m) => (
          <MemberRow key={m.user_id} member={m} isSelf={m.user_id === session.user.id} canManage={team.can_manage} actorRole={session.role!} actions={{ update, remove, setPassword }} access={access} />
        ))}
      </ul>
      {hint && <p className="px-5 py-3 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
