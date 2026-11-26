import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import type { Activity } from '@/lib/types'

/** The card an activity belongs to (amoCRM opens the lead card from a task): deal first, then contact, then company. */
export function recordPathOf(a: Activity): string | null {
  if (a.deal_id) return `/deals/${a.deal_id}`
  if (a.contact_id) return `/contacts/${a.contact_id}`
  if (a.company_id) return `/companies/${a.company_id}`
  return null
}

/** Opens an activity where it is worked on: its record card, or — for a task on nothing — the task itself. */
export function useOpenActivity() {
  const navigate = useNavigate()
  const openModal = useEntityModal()
  return useCallback((a: Activity) => {
    const path = recordPathOf(a)
    if (path) navigate(path)
    else openModal({ kind: 'activity', initial: a })
  }, [navigate, openModal])
}
