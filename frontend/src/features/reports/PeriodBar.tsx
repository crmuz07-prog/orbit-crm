import { useTranslation } from 'react-i18next'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { PRESETS, type Preset, type usePeriod } from './usePeriod'

/** From / to dates plus presets; the report follows them immediately. */
export function PeriodBar({ period }: { period: ReturnType<typeof usePeriod> }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="glass-subtle flex rounded-lg p-0.5">
        {(Object.keys(PRESETS) as Preset[]).map((p) => (
          <button key={p} type="button" onClick={() => period.applyPreset(p)} aria-pressed={period.preset === p}
            className={cn('rounded-md px-2 py-1 text-xs font-medium transition-colors', period.preset === p ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            {t(`reports.presets.${p}`)}
          </button>
        ))}
      </div>
      <DatePicker value={period.from} onChange={(v) => v && period.setFrom(v)} aria-label={t('reports.from')} className="w-36" />
      <span className="text-xs text-muted-foreground">—</span>
      <DatePicker value={period.to} onChange={(v) => v && period.setTo(v)} aria-label={t('reports.to')} className="w-36" />
    </div>
  )
}
