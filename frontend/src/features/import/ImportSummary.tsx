import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImportResult } from '@/lib/types'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-subtle rounded-lg px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Names({ title, names }: { title: string; names: string[] }) {
  if (!names.length) return null
  return <p className="text-xs"><span className="text-muted-foreground">{title}:</span> {names.join(', ')}</p>
}

export function ImportSummary({ result }: { result: ImportResult }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-4" /> {t('importer.doneTitle')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t('importer.created')} value={result.created} />
        <Stat label={t('importer.updated')} value={result.updated} />
        <Stat label={t('importer.tasks')} value={result.tasks_created} />
        <Stat label={t('importer.skipped')} value={result.skipped} />
      </div>
      <Names title={t('importer.stagesCreated')} names={result.stages_created} />
      <Names title={t('importer.fieldsCreated')} names={result.fields_created} />
      {result.unmatched_owners.length > 0 && (
        <p className="rounded-lg bg-amber-400/15 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">{t('importer.unmatched')} <b>{result.unmatched_owners.join(', ')}</b></p>
      )}
      <p className="text-[11px] text-muted-foreground">{t('importer.reimportHint')}</p>
    </div>
  )
}
