import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_BASE, tokenStore } from '@/lib/http'
import type { CallEvent } from '@/lib/types'

export type LiveCall = CallEvent & { answeredAt?: number }

interface CallEventsState {
  calls: LiveCall[]
  dismiss: (callId: string) => void
}

const CallEventsContext = createContext<CallEventsState>({ calls: [], dismiss: () => {} })

// Records whose data changes when the PBX reports a call.
const AFFECTED = [['activities'], ['contacts'], ['reminders'], ['calls', 'stats']]

/** Subscribes to the API's Server-Sent Events and keeps the state of live / just-ended calls. */
export function CallEventsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [calls, setCalls] = useState<Record<string, LiveCall>>({})

  const receive = useCallback((event: CallEvent) => {
    setCalls((prev) => {
      const previous = prev[event.call.id]
      const answeredAt = event.type === 'answered' ? Date.now() : previous?.answeredAt
      return { ...prev, [event.call.id]: { ...event, answeredAt } }
    })
    AFFECTED.forEach((queryKey) => qc.invalidateQueries({ queryKey }))
  }, [qc])

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) return
    // EventSource reconnects by itself after network errors.
    const source = new EventSource(`${API_BASE}/telephony/stream?token=${encodeURIComponent(token)}`)
    source.addEventListener('call', (e) => receive(JSON.parse((e as MessageEvent<string>).data) as CallEvent))
    return () => source.close()
  }, [receive])

  const dismiss = useCallback((callId: string) => setCalls(({ [callId]: _, ...rest }) => rest), [])

  return <CallEventsContext.Provider value={{ calls: Object.values(calls), dismiss }}>{children}</CallEventsContext.Provider>
}

export const useCallEvents = () => useContext(CallEventsContext)
