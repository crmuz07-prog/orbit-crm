import { useState } from 'react'
import { toIsoDate } from '@/components/ui/date-picker'

export const PRESETS = { today: 0, week: 6, month: 29, quarter: 89 } as const
export type Preset = keyof typeof PRESETS

const daysAgo = (n: number) => toIsoDate(new Date(Date.now() - n * 86_400_000))

/** A reporting period as two ISO dates (inclusive), with quick presets like the client's sheet. */
export function usePeriod(initial: Preset = 'month') {
  const [from, setFrom] = useState(daysAgo(PRESETS[initial]))
  const [to, setTo] = useState(daysAgo(0))
  const applyPreset = (p: Preset) => { setFrom(daysAgo(PRESETS[p])); setTo(daysAgo(0)) }
  const preset = (Object.keys(PRESETS) as Preset[]).find((p) => from === daysAgo(PRESETS[p]) && to === daysAgo(0))
  return { from, to, setFrom, setTo, applyPreset, preset }
}
