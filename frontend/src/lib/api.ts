import type { Activity, CallDirection, CallLog, CallStats, Dashboard, ProviderStatus, Session, TableMap, TableName, TelephonySettings, Token } from './types'
import { http } from './http'

export type Draft<K extends TableName> = Partial<TableMap[K]>

const PATHS: Record<TableName, string> = {
  pipeline_stages: '/stages',
  companies: '/companies',
  contacts: '/contacts',
  deals: '/deals',
  activities: '/activities',
}

/** Server-managed fields are never sent back to the API. */
function writable<T extends object>(draft: T) {
  const { id: _id, created_at: _c, updated_at: _u, closed_at: _closed, ...rest } = draft as Record<string, unknown>
  return rest
}

export const api = {
  list: <K extends TableName>(t: K) => http<TableMap[K][]>('GET', PATHS[t]),
  create: <K extends TableName>(t: K, draft: Draft<K>) => http<TableMap[K]>('POST', PATHS[t], writable(draft)),
  update: <K extends TableName>(t: K, id: string, patch: Draft<K>) => http<TableMap[K]>('PATCH', `${PATHS[t]}/${id}`, writable(patch)),
  remove: (t: TableName, id: string) => http<void>('DELETE', `${PATHS[t]}/${id}`),
  dashboard: () => http<Dashboard>('GET', '/dashboard'),
  seed: () => http<void>('POST', '/workspace/seed'),
  reset: () => http<void>('POST', '/workspace/reset'),
  logCall: (call: CallLog) => http<{ call: Activity; follow_up: Activity | null }>('POST', '/calls', call),
  callStats: () => http<CallStats>('GET', '/calls/stats'),
  reminders: () => http<Activity[]>('GET', '/reminders'),
}

type Simulation = { action: 'start' | 'end'; call_id?: string; phone: string; direction: CallDirection; status?: ProviderStatus; duration?: number }

export const telephonyApi = {
  settings: () => http<TelephonySettings>('GET', '/telephony'),
  update: (patch: Partial<TelephonySettings>) => http<TelephonySettings>('PATCH', '/telephony', patch),
  rotate: () => http<TelephonySettings>('POST', '/telephony/rotate'),
  simulate: (s: Simulation) => http<{ call_id: string; activity: Activity }>('POST', '/telephony/simulate', s),
}

export const authApi = {
  login: (email: string, password: string) => http<Token>('POST', '/auth/login', { email, password }),
  register: (full_name: string, email: string, password: string) => http<Token>('POST', '/auth/register', { full_name, email, password }),
  demo: () => http<Token>('POST', '/auth/demo'),
  me: () => http<Session>('GET', '/auth/me'),
}
