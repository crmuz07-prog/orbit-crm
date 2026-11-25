import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { Card, CardHeader } from '@/components/ui/card'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import type { Deal } from '@/lib/types'
import { fullName } from '@/lib/utils'
import { IconButton } from '@/components/common/icon-button'

function AssociationCard({ title, to, media, name, detail, extra }: { title: string; to: string; media: ReactNode; name: string; detail?: string | null; extra?: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={to} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80">
          {media}
          <div className="min-w-0">
            <p className="text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{detail}</p>
          </div>
        </Link>
        {extra}
      </div>
    </Card>
  )
}

const iconLink = 'text-muted-foreground transition-colors hover:text-primary'

/** The deal's primary contact and company (HubSpot "associations" sidebar). */
export function AssociationCards({ deal }: { deal: Deal }) {
  const { contactById, companyById } = useCrm()
  const { t } = useTranslation()
  const labels = useLabels()
  const openModal = useEntityModal()
  const contact = deal.contact_id ? contactById.get(deal.contact_id) : undefined
  const company = deal.company_id ? companyById.get(deal.company_id) : undefined

  return (
    <>
      {contact && (
        <AssociationCard
          title={t('deals.contact')}
          to={`/contacts/${contact.id}`}
          media={<PersonAvatar name={fullName(contact)} size="md" />}
          name={fullName(contact)}
          detail={contact.title}
          extra={
            <>
              {contact.email && <a href={`mailto:${contact.email}`} className={iconLink} aria-label={t('contacts.email')}><Mail className="size-4" /></a>}
              <IconButton label={t('contacts.call')} className="text-emerald-600" onClick={() => openModal({ kind: 'call', initial: { contact_id: contact.id, deal_id: deal.id, company_id: deal.company_id } })}><Phone /></IconButton>
            </>
          }
        />
      )}
      {company && (
        <AssociationCard
          title={t('deals.company')}
          to={`/companies/${company.id}`}
          media={<CompanyLogo name={company.name} size="md" />}
          name={company.name}
          detail={[labels.industry(company.industry), company.country].filter(Boolean).join(' · ')}
        />
      )}
    </>
  )
}
