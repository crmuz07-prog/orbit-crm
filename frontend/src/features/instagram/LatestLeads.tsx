import { Instagram } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonAvatar } from '@/components/common/avatars'
import { ListCard, RowLink } from '@/components/common/record'
import { EmptyState } from '@/components/common/states'
import { StageBadge } from '@/features/deals/bits'
import { useCrm } from '@/hooks/useData'
import { fullName, timeAgo } from '@/lib/utils'

/** Newest deals that came from Instagram (Direct or lead forms), each opening its record card and chat. */
export function LatestLeads({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { deals, contactById, stageById } = useCrm()
  const latest = deals.filter((d) => d.source === 'Instagram').sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
  return (
    <div className={className}>
      <ListCard
        title={t('instagram.latest')}
        description={t('instagram.latestDesc')}
        items={latest}
        empty={<EmptyState icon={Instagram} title={t('instagram.empty')} compact />}
        render={(deal) => {
          const contact = deal.contact_id ? contactById.get(deal.contact_id) : undefined
          const name = contact ? fullName(contact) : deal.title
          return (
            <RowLink to={`/deals/${deal.id}`}>
              <PersonAvatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Instagram className="size-3 text-pink-500" /> {contact?.instagram_id ? (contact.instagram_username ? `@${contact.instagram_username}` : t('instagram.kind.message')) : t('instagram.kind.lead_form')} · {timeAgo(deal.created_at)}
                </p>
              </div>
              <StageBadge stage={stageById.get(deal.stage_id)} />
            </RowLink>
          )
        }}
      />
    </div>
  )
}
