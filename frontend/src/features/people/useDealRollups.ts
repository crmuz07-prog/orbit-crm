import { useMemo } from 'react'
import { useCrm } from '@/hooks/useData'
import { dealStatus } from '@/lib/metrics'

export type Rollup = { open: number; openAmount: number; won: number; contacts: number }
const empty: Rollup = { open: 0, openAmount: 0, won: 0, contacts: 0 }

/** Per contact or company: open deals (count, amount), won amount and — for companies — people (HubSpot association metrics). */
export function useDealRollups(link: 'contact_id' | 'company_id') {
  const { deals, contacts, stageById } = useCrm()
  return useMemo(() => {
    const map = new Map<string, Rollup>()
    const get = (id: string) => map.get(id) ?? map.set(id, { ...empty }).get(id)!
    for (const d of deals) {
      const id = d[link]
      if (!id) continue
      const status = dealStatus(d, stageById)
      if (status === 'open') { get(id).open++; get(id).openAmount += d.amount }
      if (status === 'won') get(id).won += d.amount
    }
    if (link === 'company_id') contacts.forEach((c) => c.company_id && get(c.company_id).contacts++)
    return (id: string) => map.get(id) ?? empty
  }, [deals, contacts, stageById, link])
}
