import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCrm } from '@/hooks/useData'
import type { Activity } from '@/lib/types'
import { fullName, timeAgo } from '@/lib/utils'
import { DueLabel } from './DueLabel'

/** Meta line under an activity: due date / age and links to the related records. */
export function ActivityMeta({ activity: a, showType, showDeal = true }: { activity: Activity; showType?: boolean; showDeal?: boolean }) {
  const { t } = useTranslation()
  const { dealById, companyById, contactById } = useCrm()
  const deal = a.deal_id ? dealById.get(a.deal_id) : undefined
  const company = a.company_id ? companyById.get(a.company_id) : undefined
  const contact = a.contact_id ? contactById.get(a.contact_id) : undefined
  const link = 'hover:text-foreground hover:underline'

  return (
    <>
      {showType && <span>{t(`enums.activity.${a.type}`)}</span>}
      {a.due_at && !a.done ? <DueLabel activity={a} /> : <span>{timeAgo(a.due_at ?? a.created_at)}</span>}
      {showDeal && deal && <Link to={`/deals/${deal.id}`} className="truncate text-primary hover:underline">{deal.title}</Link>}
      {showDeal && !deal && company && <Link to={`/companies/${company.id}`} className={link}>{company.name}</Link>}
      {contact && <Link to={`/contacts/${contact.id}`} className={link}>{fullName(contact)}</Link>}
    </>
  )
}
