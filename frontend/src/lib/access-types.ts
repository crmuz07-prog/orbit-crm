/** Access control: module × action permissions with own/team/all scope (mirrors backend services/permissions.py). */
export const MODULES = ['companies', 'contacts', 'deals', 'activities', 'reports'] as const
export const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'] as const
export const SCOPES = ['own', 'team', 'all'] as const
export type Module = (typeof MODULES)[number]
export type Action = (typeof ACTIONS)[number]
export type Scope = (typeof SCOPES)[number]
export type ModulePermission = Record<Action, boolean> & { scope: Scope }
export type Permissions = Record<Module, ModulePermission>

/** Reports are read-only views, so only "view" means anything there. */
export const actionsFor = (module: Module): readonly Action[] => (module === 'reports' ? ['view'] : ACTIONS)

export interface AccessRole {
  id: string
  name: string
  permissions: Permissions
  is_default: boolean
  member_count: number
}

export interface SalesTeam {
  id: string
  name: string
  member_count: number
}

export interface AccessOverview {
  roles: AccessRole[]
  teams: SalesTeam[]
}

export interface LoginAttempt {
  id: string
  email: string
  ip: string | null
  success: boolean
  created_at: string
}
