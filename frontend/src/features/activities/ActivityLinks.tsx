import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCrm } from '@/hooks/useData'
import type { Activity, RecordLink } from '@/lib/types'
import { fullName, timeAgo } from '@/lib/utils'
import { DueLabel } from './DueLabel'

/** Meta line under an activity: due date / age and links to the related records. */
/** `current`: the record page this line is shown on — linking to it again (or repeating its name) is noise. */
export function ActivityMeta({ activity: a, showType, current }: { activity: Activity; showType?: boolean; current?: RecordLink }) {
  const { t } = useTranslation()
  const { dealById, companyById, contactById } = useCrm()
  const deal = a.deal_id ? dealById.get(a.deal_id) : undefined
  const company = a.company_id ? companyById.get(a.company_id) : undefined
  const contact = a.contact_id ? contactById.get(a.contact_id) : undefined
  const link = 'hover:text-foreground hover:underline'
  const showDeal = current !== 'deal_id' && !!deal
  const showCompany = !showDeal && current !== 'company_id' && !!company
  const contactName = contact ? fullName(contact) : ''
  // Imported leads are named after the person, so the deal title and the contact often read the same.
  const showContact = current !== 'contact_id' && !!contact && contactName !== deal?.title && contactName !== company?.name

  return (
    <>
      {showType && <span>{t(`enums.activity.${a.type}`)}</span>}
      {a.due_at && !a.done ? <DueLabel activity={a} /> : <span>{timeAgo(a.due_at ?? a.created_at)}</span>}
      {showDeal && deal && <Link to={`/deals/${deal.id}`} className="truncate text-primary hover:underline">{deal.title}</Link>}
      {showCompany && company && <Link to={`/companies/${company.id}`} className={link}>{company.name}</Link>}
      {showContact && contact && <Link to={`/contacts/${contact.id}`} className={link}>{contactName}</Link>}
    </>
  )
}
