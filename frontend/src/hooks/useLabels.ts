import { useTranslation } from 'react-i18next'
import { DEAL_SOURCES, INDUSTRIES } from '@/lib/constants'

/**
 * Built-in names are stored in English (that is what the server seeds) and shown in the user's language; anything a
 * user named or renamed is shown exactly as written (HubSpot behaves the same with default pipelines and stages).
 */
const STAGE = { 'Lead In': 'leadIn', Qualified: 'qualified', 'Discovery / Demo': 'discovery', Proposal: 'proposal', Negotiation: 'negotiation', 'Closed Won': 'won', 'Closed Lost': 'lost' } as const
const PIPELINE = { 'Sales pipeline': 'sales' } as const
const ROLE = { 'Sales rep': 'salesRep', 'Team lead': 'teamLead', Viewer: 'viewer' } as const
const SOURCE = { Inbound: 'inbound', Outbound: 'outbound', Referral: 'referral', Partner: 'partner', Event: 'event', Website: 'website' } as const
const INDUSTRY = {
  SaaS: 'saas', Fintech: 'fintech', Logistics: 'logistics', Manufacturing: 'manufacturing', Healthcare: 'healthcare', Energy: 'energy',
  Retail: 'retail', Telecom: 'telecom', Education: 'education', Aerospace: 'aerospace', 'Food & Beverage': 'food', Mining: 'mining',
  Cybersecurity: 'cybersecurity', Other: 'other',
} as const

const keyOf = <M extends Record<string, string>>(map: M, value: string | null | undefined) => (value && value in map ? map[value as keyof M] : undefined)

export function useLabels() {
  const { t } = useTranslation()
  const stage = (name: string) => { const k = keyOf(STAGE, name); return k ? t(`defaults.stage.${k}`) : name }
  const pipeline = (name: string) => { const k = keyOf(PIPELINE, name); return k ? t(`defaults.pipeline.${k}`) : name }
  const role = (name: string) => { const k = keyOf(ROLE, name); return k ? t(`defaults.role.${k}`) : name }
  const source = (value: string | null | undefined) => { const k = keyOf(SOURCE, value); return k ? t(`options.source.${k}`) : value ?? '' }
  const industry = (value: string | null | undefined) => { const k = keyOf(INDUSTRY, value); return k ? t(`options.industry.${k}`) : value ?? '' }
  return {
    stage, pipeline, role, source, industry,
    sourceOptions: DEAL_SOURCES.map((v) => ({ value: v, label: source(v) })),
    industryOptions: INDUSTRIES.map((v) => ({ value: v, label: industry(v) })),
  }
}
