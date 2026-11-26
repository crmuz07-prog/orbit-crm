import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { reportsApi } from '@/lib/api'
import { cn, shortDate } from '@/lib/utils'
import { InfoSection } from './RecordCard'
import { FIELD_ROW } from './InlineField'

const ROWS = ['platform', 'campaign', 'adset', 'ad_name', 'form_name', 'ad_id', 'form_id'] as const

/** Where the lead came from (Meta lead form or an import): platform, campaign, ad set, ad and form. */
export function LeadSource({ dealId }: { dealId: string }) {
  const { t } = useTranslation()
  const { data } = useQuery({ queryKey: ['attribution', dealId], queryFn: () => reportsApi.attribution(dealId) })
  if (!data || !ROWS.some((k) => data[k])) return null
  return (
    <InfoSection title={t('leadSource.title')}>
      {ROWS.filter((k) => data[k]).map((k) => (
        <div key={k} className={cn(FIELD_ROW, 'py-1')}>
          <span className="text-muted-foreground">{t(`leadSource.${k}`)}</span>
          <span className="break-words">{k === 'platform' ? t(`leadSource.platforms.${data.platform}`, { defaultValue: data.platform ?? '' }) : data[k]}</span>
        </div>
      ))}
      <p className="mt-1 text-[11px] text-muted-foreground">{t('leadSource.received', { date: shortDate(data.created_at) })}</p>
    </InfoSection>
  )
}
