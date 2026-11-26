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
  // Imported leads are named after the person, so deal, company and contact often read the same. The deal link is
  // always kept (off its own page): it says which deal the activity belongs to. Company and contact are shown only
  // when their name adds something — not the current record's, not one already shown.
  const records = [
    { key: 'deal_id', to: deal && `/deals/${deal.id}`, name: deal?.title, className: 'truncate text-primary hover:underline' },
    { key: 'company_id', to: company && `/companies/${company.id}`, name: company?.name, className: link },
    { key: 'contact_id', to: contact && `/contacts/${contact.id}`, name: contact && fullName(contact), className: link },
  ] as const
  const seen = new Set(records.filter((r) => r.key === current).map((r) => r.name))
  const shown = records.filter((r) => {
    if (!r.to || !r.name || r.key === current || (r.key !== 'deal_id' && seen.has(r.name))) return false
    seen.add(r.name)
    return true
  })
  // The company only stands in for a missing deal (as before): with a deal, its company is one click away.
  const links = shown.filter((r) => r.key !== 'company_id' || !shown.some((o) => o.key === 'deal_id'))

  return (
    <>
      {showType && <span>{t(`enums.activity.${a.type}`)}</span>}
      {a.due_at && !a.done ? <DueLabel activity={a} /> : <span>{timeAgo(a.due_at ?? a.created_at)}</span>}
      {links.map((r) => <Link key={r.key} to={r.to ?? ''} className={r.className}>{r.name}</Link>)}
    </>
  )
}
