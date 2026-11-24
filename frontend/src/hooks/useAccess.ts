import { useAuth } from '@/auth/AuthProvider'
import type { Action, Module, Scope, TableName } from '@/lib/types'

/** Which permission module guards a table (pipeline stages are workspace configuration, not a module). */
export const TABLE_MODULE: Record<TableName, Module | null> = {
  pipeline_stages: null, companies: 'companies', contacts: 'contacts', deals: 'deals', activities: 'activities',
}

/** The caller's permissions, mirrored from the session; the API is the real boundary. */
export function useAccess() {
  const { session } = useAuth()
  const permissions = session?.permissions
  return {
    // Outside a company (a platform superadmin) there is no CRM data to touch at all.
    can: (module: Module | null, action: Action) => !!session?.workspace && (module === null || !!permissions?.[module]?.[action]),
    scope: (module: Module): Scope => permissions?.[module]?.scope ?? 'own',
    isAdmin: session?.role === 'owner' || session?.role === 'admin',
  }
}
