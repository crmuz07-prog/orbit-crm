import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_BASE, http, tokenStore } from '@/lib/http'
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
    if (!tokenStore.get()) return
    let source: EventSource | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let stopped = false
    // The URL carries a one-minute stream ticket, never the session token (URLs end up in logs). EventSource's own
    // reconnect would reuse an expired ticket, so every reconnect asks for a fresh one.
    const connect = async () => {
      try {
        const { ticket } = await http<{ ticket: string }>('POST', '/telephony/stream-ticket')
        if (stopped) return
        source = new EventSource(`${API_BASE}/telephony/stream?ticket=${encodeURIComponent(ticket)}`)
        source.addEventListener('call', (e) => receive(JSON.parse((e as MessageEvent<string>).data) as CallEvent))
        source.onerror = () => { source?.close(); if (!stopped) retry = setTimeout(connect, 5000) }
      } catch {
        if (!stopped) retry = setTimeout(connect, 15000)
      }
    }
    void connect()
    return () => { stopped = true; clearTimeout(retry); source?.close() }
  }, [receive])

  const dismiss = useCallback((callId: string) => setCalls(({ [callId]: _, ...rest }) => rest), [])

  return <CallEventsContext.Provider value={{ calls: Object.values(calls), dismiss }}>{children}</CallEventsContext.Provider>
}

export const useCallEvents = () => useContext(CallEventsContext)
