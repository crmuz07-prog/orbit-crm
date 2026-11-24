import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDuration } from '@/features/record/duration'
import { useAccess } from '@/hooks/useAccess'
import { historyApi } from '@/lib/api'
import { STAGE_COLORS } from '@/lib/constants'
import type { Pipeline, Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

const PERIODS = ['7', '30', '90'] as const

function ReportTable({ pipeline, stages, days }: { pipeline: Pipeline; stages: Stage[]; days: number }) {
  const { t } = useTranslation()
  const { data = [] } = useQuery({ queryKey: ['movement', pipeline.id, days], queryFn: () => historyApi.movement(pipeline.id, days) })
  const rows = new Map(data.map((r) => [r.stage_id, r]))
  return (
    <div className="overflow-x-auto rounded-xl border border-foreground/[0.08]">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-foreground/[0.06] text-left">
            <th className="px-3 py-2 font-medium">{t('report.stage')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('report.now')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('report.entered')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('report.avgTime')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/[0.05]">
          {stages.map((s) => {
            const row = rows.get(s.id)
            return (
              <tr key={s.id}>
                <td className="px-3 py-2"><span className={cn('mr-2 inline-block size-2 rounded-full', STAGE_COLORS[s.color].dot)} />{s.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row?.deals_now ?? 0}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row?.entered ?? 0}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{row?.avg_seconds != null ? formatDuration(row.avg_seconds, t) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** amoCRM "Отчёт по движению сделок": how deals flow through the stages of a pipeline over a period. */
export function MovementReport({ pipeline, stages }: { pipeline?: Pipeline; stages: Stage[] }) {
  const { t } = useTranslation()
  const { can } = useAccess()
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState<string>('30')
  if (!pipeline || !can('reports', 'view')) return null
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><BarChart3 /> {t('board.report')}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('report.title')} · {pipeline.name}</DialogTitle></DialogHeader>
          <SelectBox value={days} onChange={setDays} options={PERIODS.map((d) => ({ value: d, label: t('report.days', { count: Number(d) }) }))} className="w-48" />
          {open && <ReportTable pipeline={pipeline} stages={stages} days={Number(days)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
