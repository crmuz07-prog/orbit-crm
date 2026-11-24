import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Checkbox } from '@/components/ui/checkbox'
import { ACTIONS, MODULES, SCOPES, actionsFor, type Action, type Module, type ModulePermission, type Permissions, type Scope } from '@/lib/types'

/** Any granted action implies view; removing view clears the module (same rule as the API). */
export function toggle(entry: ModulePermission, action: Action, on: boolean): ModulePermission {
  if (action === 'view' && !on) return { ...entry, view: false, create: false, edit: false, delete: false, export: false }
  return { ...entry, [action]: on, view: on || entry.view }
}

// Square variant of the round task checkbox.
const SQUARE = 'rounded-[5px] hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary'

/** Sections × actions grid with a records scope per section (HubSpot / erp1 permission editor). */
export function PermissionMatrix({ value, onChange }: { value: Permissions; onChange: (p: Permissions) => void }) {
  const { t } = useTranslation()
  const set = (module: Module, entry: ModulePermission) => onChange({ ...value, [module]: entry })
  const scopes = SCOPES.map((s) => ({ value: s, label: t(`access.scopes.${s}`) }))

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-foreground/[0.08]">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-foreground/[0.06]">
              <th className="px-3 py-2 text-left font-medium">{t('access.module')}</th>
              {ACTIONS.map((a) => <th key={a} className="px-2 py-2 font-medium">{t(`access.actions.${a}`)}</th>)}
              <th className="px-3 py-2 text-left font-medium">{t('access.scope')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/[0.05]">
            {MODULES.map((m) => (
              <tr key={m}>
                <td className="px-3 py-2 font-medium">{t(`access.modules.${m}`)}</td>
                {ACTIONS.map((a) => !actionsFor(m).includes(a) ? <td key={a} className="px-2 py-2 text-center text-muted-foreground/50">—</td> : (
                  <td key={a} className="px-2 py-2 text-center">
                    <Checkbox className={`mx-auto ${SQUARE}`} checked={value[m][a]} onCheckedChange={(on) => set(m, toggle(value[m], a, on === true))}
                      aria-label={`${t(`access.modules.${m}`)}: ${t(`access.actions.${a}`)}`} />
                  </td>
                ))}
                <td className="px-3 py-1.5">
                  <SelectBox value={value[m].scope} onChange={(s) => set(m, { ...value[m], scope: s as Scope })} options={scopes} className="h-8 w-32" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t('access.scopeHint')}</p>
    </div>
  )
}
