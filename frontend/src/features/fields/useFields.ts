import { useMemo } from 'react'
import { useRows } from '@/hooks/useData'
import type { CustomField, CustomValue, Deal } from '@/lib/types'
import { shortDate } from '@/lib/utils'

/** The workspace's deal fields in their configured order. */
export function useCustomFields() {
  const { data } = useRows('custom_fields')
  return useMemo(() => [...(data ?? [])].sort((a, b) => a.position - b.position), [data])
}

export const valueList = (value: CustomValue | undefined): string[] =>
  value === null || value === undefined || value === '' ? [] : Array.isArray(value) ? value : [String(value)]

export const isWarning = (field: CustomField, value: CustomValue | undefined) => valueList(value).some((v) => field.warn_options.includes(v))

/** Deals with a value that needs attention (e.g. below the minimum order). */
export const dealWarnings = (deal: Deal, fields: CustomField[]) => fields.filter((f) => isWarning(f, deal.custom?.[f.key]))

export function displayValue(field: CustomField, value: CustomValue | undefined): string {
  const values = valueList(value)
  if (field.type === 'date') return values[0] ? shortDate(values[0]) : ''
  return values.join(', ')
}

/** List fields worth showing on a board card: few distinct values, so a chip reads at a glance. */
export const chipFields = (fields: CustomField[]) => fields.filter((f) => f.type === 'select' || f.type === 'multiselect')
