import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ActivityForm } from '@/features/activities/ActivityForm'
import { CallForm } from '@/features/calls/CallForm'
import { CallWrapUpForm } from '@/features/telephony/CallWrapUpForm'
import { CompanyForm } from '@/features/companies/CompanyForm'
import { ContactForm } from '@/features/contacts/ContactForm'
import { DealForm } from '@/features/deals/DealForm'
import type { Activity, Company, Contact, Deal } from '@/lib/types'

export type EntityRequest =
  | { kind: 'company'; initial?: Partial<Company> }
  | { kind: 'contact'; initial?: Partial<Contact> }
  | { kind: 'deal'; initial?: Partial<Deal> }
  | { kind: 'activity'; initial?: Partial<Activity> }
  | { kind: 'call'; initial?: Partial<Pick<Activity, 'deal_id' | 'company_id' | 'contact_id'>> }
  | { kind: 'wrapUp'; initial: Activity }

const RECORD_PATH = { company: '/companies', contact: '/contacts', deal: '/deals', activity: null, call: null, wrapUp: null }

const EntityModalContext = createContext<((req: EntityRequest) => void) | null>(null)

function EntityFormFor({ request, onDone }: { request: EntityRequest; onDone: (row?: { id: string }) => void }) {
  switch (request.kind) {
    case 'company': return <CompanyForm initial={request.initial} onDone={onDone} />
    case 'contact': return <ContactForm initial={request.initial} onDone={onDone} />
    case 'deal': return <DealForm initial={request.initial} onDone={onDone} />
    case 'activity': return <ActivityForm initial={request.initial} onDone={onDone} />
    case 'call': return <CallForm initial={request.initial} onDone={() => onDone()} />
    case 'wrapUp': return <CallWrapUpForm initial={request.initial} onDone={() => onDone()} />
  }
}

/** Owns every create/edit dialog, so any screen or the ⌘K palette can open one. */
export function EntityModalProvider({ children }: { children: ReactNode }) {
  // The last request stays mounted while the dialog animates out.
  const [request, setRequest] = useState<EntityRequest | null>(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const close = useCallback(() => setOpen(false), [])
  const show = useCallback((req: EntityRequest) => {
    setRequest(req)
    setOpen(true)
  }, [])
  const editing = !!request?.initial && 'id' in request.initial

  // A record created from scratch opens its page; one created in context keeps the user in place.
  const done = (row?: { id: string }) => {
    const path = request && RECORD_PATH[request.kind]
    close()
    if (row && path && !request?.initial) navigate(`${path}/${row.id}`)
  }

  return (
    <EntityModalContext.Provider value={show}>
      {children}
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{request && t(`dialog.${editing ? 'edit' : 'new'}.${request.kind}`)}</DialogTitle>
          </DialogHeader>
          {request && <EntityFormFor key={JSON.stringify(request)} request={request} onDone={done} />}
        </DialogContent>
      </Dialog>
    </EntityModalContext.Provider>
  )
}

export function useEntityModal() {
  const open = useContext(EntityModalContext)
  if (!open) throw new Error('useEntityModal must be used inside <EntityModalProvider>')
  return open
}
