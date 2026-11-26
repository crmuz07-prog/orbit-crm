import { useTranslation } from 'react-i18next'
import { useMembers } from '@/features/team/useMembers'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import type { FieldChange, RecordEvent, RecordLink } from '@/lib/types'
import { fullName, groupDigits, timeOf, toDate } from '@/lib/utils'

const MONEY_FIELDS = new Set(['amount', 'annual_revenue'])

/** Turns a stored value into what a person recognises (names instead of ids, formatted numbers). */
function useReadable() {
  const { companyById, contactById } = useCrm()
  const { memberById } = useMembers()
  const { t } = useTranslation()
  const labels = useLabels()
  return (field: string, value: FieldChange['new']): string => {
    if (value === null || value === '') return ''
    if (field === 'source') return labels.source(String(value))
    if (field === 'industry') return labels.industry(String(value))
    if (field === 'priority' || field === 'lifecycle') return t(`enums.${field}.${value as 'low'}`, { defaultValue: String(value) })
    if (field === 'company_id') return companyById.get(String(value))?.name ?? '—'
    if (field === 'contact_id') { const c = contactById.get(String(value)); return c ? fullName(c) : '—' }
    if (field === 'owner_id') return memberById.get(String(value))?.full_name ?? '—'
    if (MONEY_FIELDS.has(field) && typeof value === 'number') return groupDigits(value)
    return String(value)
  }
}

/** One system line of the feed, amoCRM style: "09:33 Ozod Imomov set «Name» to «alicom»". */
export function EventLine({ event, link }: { event: RecordEvent; link: RecordLink }) {
  const { t } = useTranslation()
  const { stageById } = useCrm()
  const { memberById } = useMembers()
  const readable = useReadable()
  const actor = (event.actor_id && memberById.get(event.actor_id)?.full_name) || t('feed.system')
  // "title" is the deal name but a contact's job title.
  const label = (field: string) => t(`feedFields.${field === 'title' && link === 'contact_id' ? 'title_job' : field}`, { defaultValue: field })
  const labels = useLabels()
  const stage = (id?: string) => { const s = id ? stageById.get(id) : undefined; return s ? labels.stage(s.name) : '—' }

  const lines: string[] = event.kind === 'created'
    ? [event.changes.stage_id ? t('feed.createdIn', { stage: stage(event.changes.stage_id) }) : t('feed.created')]
    : event.kind === 'stage_changed'
      ? [t('feed.moved', { from: stage(event.changes.from), to: stage(event.changes.to) })]
      : event.changes.map((c) => {
        const value = readable(c.field, c.new)
        return value ? t('feed.set', { field: label(c.field), value }) : t('feed.cleared', { field: label(c.field) })
      })

  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className="px-1 py-0.5 text-[13px] leading-relaxed text-muted-foreground">
          <span className="tabular-nums">{timeOf(toDate(event.created_at))}</span>{' '}
          <span className="font-medium text-foreground/80">{actor}</span> {line}
        </p>
      ))}
    </>
  )
}
