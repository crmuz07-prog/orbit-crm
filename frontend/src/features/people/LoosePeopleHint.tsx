import { UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { matches } from '@/components/common/search-input'
import { useCrm } from '@/hooks/useData'
import { fullName } from '@/lib/utils'

/** A company search for a person who has no company (most inbound leads) points to the contacts that match. */
export function LoosePeopleHint({ query }: { query: string }) {
  const { t } = useTranslation()
  const { contacts } = useCrm()
  if (!query.trim()) return null
  const loose = contacts.filter((c) => !c.company_id && matches(query, fullName(c), c.phone, c.email))
  if (!loose.length) return null
  const names = loose.slice(0, 3).map(fullName).join(', ') + (loose.length > 3 ? '…' : '')
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-primary/[0.06] px-3 py-2 text-[13px]">
      <UserRound className="size-4 text-primary" />
      <span>{t('companies.looseFound', { count: loose.length, names })}</span>
      <Link to={`/contacts?q=${encodeURIComponent(query.trim())}`} className="font-medium text-primary hover:underline">{t('companies.looseOpen')}</Link>
    </div>
  )
}
