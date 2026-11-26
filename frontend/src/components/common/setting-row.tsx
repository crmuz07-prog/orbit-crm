import type { ReactNode } from 'react'

/** One setting per row: what it is (and a short why) on the left, its control on the right — profile, member dialog. */
export function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-foreground/[0.06] px-4 py-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:items-center">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
    </div>
  )
}
