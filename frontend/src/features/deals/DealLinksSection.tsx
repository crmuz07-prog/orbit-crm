import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { IconButton } from '@/components/common/icon-button'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { SectionHeading } from '@/features/record/RecordCard'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import type { Deal } from '@/lib/types'
import { fullName } from '@/lib/utils'

/** One linked record as a line: avatar, name · detail (opens it), quick actions on the right. */
function LinkedLine({ to, media, name, detail, actions }: { to: string; media: ReactNode; name: string; detail?: string | null; actions?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 transition-colors hover:bg-foreground/[0.03]">
      <Link to={to} className="flex min-w-0 flex-1 items-center gap-2 focus-visible:outline-none focus-visible:underline">
        {media}
        <span className="min-w-0 flex-1 truncate text-[13px]">
          <span className="font-medium">{name}</span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </span>
      </Link>
      {actions}
    </div>
  )
}

/**
 * The deal's contact and company inside its info panel (HubSpot "associations"): one line each that opens the record,
 * with e-mail and call at hand. Nothing linked — no section.
 */
export function DealLinksSection({ deal }: { deal: Deal }) {
  const { contactById, companyById } = useCrm()
  const { t } = useTranslation()
  const labels = useLabels()
  const openModal = useEntityModal()
  const contact = deal.contact_id ? contactById.get(deal.contact_id) : undefined
  const company = deal.company_id ? companyById.get(deal.company_id) : undefined
  if (!contact && !company) return null
  return (
    <section className="border-t border-foreground/[0.06] py-2.5">
      <SectionHeading title={t('card.linked')} className="px-4" />
      {contact && (
        <LinkedLine to={`/contacts/${contact.id}`} media={<PersonAvatar name={fullName(contact)} size="xs" />} name={fullName(contact)} detail={contact.title ?? contact.phone}
          actions={
            <>
              {contact.email && <IconButton label={t('contacts.email')} className="size-7" asChild><a href={`mailto:${contact.email}`}><Mail /></a></IconButton>}
              <IconButton label={t('contacts.call')} className="size-7 text-emerald-600" onClick={() => openModal({ kind: 'call', initial: { contact_id: contact.id, deal_id: deal.id, company_id: deal.company_id } })}><Phone /></IconButton>
            </>
          } />
      )}
      {company && (
        <LinkedLine to={`/companies/${company.id}`} media={<CompanyLogo name={company.name} size="xs" />} name={company.name}
          detail={[labels.industry(company.industry), company.country].filter(Boolean).join(' · ') || null} />
      )}
    </section>
  )
}
