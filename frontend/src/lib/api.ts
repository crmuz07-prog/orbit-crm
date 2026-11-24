import type {
  Activity, AdminUser, AuthConfig, CallDirection, CallLog, CallStats, Company, Dashboard, NewLogin, ProviderStatus, Role, Session, TableMap, TableName,
  Team, TeamMember, TelephonySettings, Token, User, WorkspaceChoice,
} from './types'
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
  config: () => http<AuthConfig>('GET', '/auth/config'),
  workspaces: () => http<WorkspaceChoice[]>('GET', '/auth/workspaces'),
  switch: (workspace_id: string) => http<Token>('POST', '/auth/switch', { workspace_id }),
  forgot: (email: string) => http<void>('POST', '/auth/forgot', { email }),
  reset: (token: string, password: string) => http<Token>('POST', '/auth/reset', { token, password }),
  verify: (token: string) => http<User>('POST', '/auth/verify', { token }),
  resendVerification: () => http<void>('POST', '/auth/verify/resend'),
  updateProfile: (full_name: string) => http<User>('PATCH', '/auth/me', { full_name }),
  changePassword: (current_password: string | null, new_password: string) => http<void>('POST', '/auth/password', { current_password, new_password }),
}

export const teamApi = {
  get: () => http<Team>('GET', '/team'),
  add: (login: NewLogin & { role: Role }) => http<TeamMember & { account_created: boolean }>('POST', '/team/members', login),
  changeRole: (userId: string, role: Role) => http<TeamMember>('PATCH', `/team/members/${userId}`, { role }),
  remove: (userId: string) => http<void>('DELETE', `/team/members/${userId}`),
  setPassword: (userId: string, password: string) => http<void>('POST', `/team/members/${userId}/password`, { password }),
}

export const adminApi = {
  companies: () => http<Company[]>('GET', '/admin/companies'),
  createCompany: (name: string, owner: NewLogin) => http<Company>('POST', '/admin/companies', { name, owner }),
  renameCompany: (id: string, name: string) => http<void>('PATCH', `/admin/companies/${id}`, { name }),
  users: () => http<AdminUser[]>('GET', '/admin/users'),
  createUser: (login: NewLogin & { workspace_id: string | null; role: Role }) => http<AdminUser>('POST', '/admin/users', login),
  updateUser: (id: string, patch: Partial<Pick<AdminUser, 'full_name' | 'is_active' | 'is_superadmin'>>) => http<AdminUser>('PATCH', `/admin/users/${id}`, patch),
  setPassword: (id: string, password: string) => http<void>('POST', `/admin/users/${id}/password`, { password }),
  addMembership: (id: string, workspace_id: string, role: Role) => http<AdminUser>('POST', `/admin/users/${id}/memberships`, { workspace_id, role }),
  removeMembership: (id: string, workspaceId: string) => http<AdminUser>('DELETE', `/admin/users/${id}/memberships/${workspaceId}`),
}
