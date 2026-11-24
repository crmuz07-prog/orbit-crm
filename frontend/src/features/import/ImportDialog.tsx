import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SelectField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCustomFields } from '@/features/fields/useFields'
import { useCurrentPipeline } from '@/hooks/usePipelines'
import { importApi } from '@/lib/api'
import type { ColumnMap, ImportPreview, ImportResult } from '@/lib/types'
import { errorMessage } from '@/lib/utils'
import { ColumnRow } from './ColumnRow'
import { ImportSummary } from './ImportSummary'

type Picked = { name: string; content: string }

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

/** amoCRM-style import: pick a file → check the suggested column mapping → import into a pipeline. */
export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const fields = useCustomFields()
  const { pipeline, pipelines } = useCurrentPipeline()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<Picked | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [columns, setColumns] = useState<ColumnMap[]>([])
  const [pipelineId, setPipelineId] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const reset = () => { setFile(null); setPreview(null); setColumns([]); setResult(null) }

  const read = useMutation({
    mutationFn: async (f: File) => ({ name: f.name, content: await toBase64(f) }),
    onSuccess: async (picked) => {
      setFile(picked)
      try {
        const p = await importApi.preview(picked.name, picked.content)
        setPreview(p)
        setColumns(p.columns)
      } catch (e) { toast.error(errorMessage(e)); reset() }
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const run = useMutation({
    mutationFn: () => importApi.run(file!.name, file!.content, pipelineId || pipeline!.id, columns),
    onSuccess: (r) => { setResult(r); toast.success(t('importer.doneTitle')); void qc.invalidateQueries() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const close = (o: boolean) => { if (!o) reset(); onOpenChange(o) }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('importer.title')}</DialogTitle>
          <DialogDescription>{t('importer.pickHint')}</DialogDescription>
        </DialogHeader>
        <input ref={input} type="file" accept=".xlsx,.xlsm,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read.mutate(f); e.target.value = '' }} />
        {result ? <ImportSummary result={result} /> : !preview ? (
          <button type="button" onClick={() => input.current?.click()} disabled={read.isPending}
            className="glass-subtle flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <Upload className="size-6" /> {read.isPending ? t('importer.reading') : t('importer.pick')}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <p className="flex items-center gap-1.5 text-sm font-medium"><FileSpreadsheet className="size-4 text-emerald-600" /> {file?.name} · {t('importer.rows', { count: preview.rows })}</p>
              <div className="ml-auto w-56"><SelectField label={t('importer.pipeline')} value={pipelineId || pipeline?.id || ''} onChange={setPipelineId} options={pipelines.map((p) => ({ value: p.id, label: p.name }))} /></div>
            </div>
            <div className="max-h-[52vh] overflow-auto rounded-lg">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-background/90 text-[11px] text-muted-foreground backdrop-blur-sm">
                  <tr><th className="py-1.5 font-medium">{t('importer.column')}</th><th className="py-1.5 font-medium">{t('importer.sample')}</th><th className="py-1.5 font-medium">{t('importer.target')}</th></tr>
                </thead>
                <tbody>{columns.map((c, i) => <ColumnRow key={c.column} column={c} fields={fields} onChange={(next) => setColumns((all) => all.map((x, j) => (j === i ? next : x)))} />)}</tbody>
              </table>
            </div>
          </div>
        )}
        <DialogFooter>
          {result ? (
            <><Button variant="outline" onClick={reset}>{t('importer.again')}</Button><Button onClick={() => close(false)}>{t('importer.close')}</Button></>
          ) : preview && (
            <><Button variant="outline" onClick={reset}>{t('common.back')}</Button>
              <Button onClick={() => run.mutate()} disabled={run.isPending || !pipeline}>{run.isPending ? t('importer.running') : t('importer.run', { count: preview.rows })}</Button></>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
