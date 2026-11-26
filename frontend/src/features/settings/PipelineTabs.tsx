import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/common/confirm-provider'
import { IconButton } from '@/components/common/icon-button'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLabels } from '@/hooks/useLabels'
import type { PipelineActions } from '@/hooks/usePipelines'
import type { Pipeline } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PipelineNameDialog } from './PipelineNameDialog'

interface Props {
  pipelines: Pipeline[]
  current: Pipeline | undefined
  dealCount: (pipelineId: string) => number
  onSelect: (id: string) => void
  actions: PipelineActions
}

/**
 * Pipelines as tabs (Pipedrive): name, deal count and a star on the default one; "New pipeline" asks for a name; the
 * selected pipeline's rename / make default / delete live in one menu, with the reason when an action is not possible.
 */
export function PipelineTabs({ pipelines, current, dealCount, onSelect, actions }: Props) {
  const { t } = useTranslation()
  const labels = useLabels()
  const ask = useConfirm()
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null)
  const name = current ? labels.pipeline(current.name) : ''
  const deals = current ? dealCount(current.id) : 0

  const makeDefault = async () => {
    if (!current) return
    const options = { title: t('confirm.defaultPipeline.title', { name }), description: t('confirm.defaultPipeline.desc'), confirmLabel: t('confirm.defaultPipeline.action'), tone: 'default' as const }
    if (await ask(options)) actions.update.mutate({ id: current.id, patch: { is_default: true } })
  }
  const remove = async () => {
    if (!current) return
    if (await ask({ title: t('pipelines.deleteConfirm', { name }), description: t('pipelines.deleteDesc'), confirmLabel: t('common.delete') })) {
      actions.remove.mutate(current.id, { onSuccess: () => onSelect(pipelines.find((p) => p.is_default)?.id ?? '') })
    }
  }
  const blocked = current?.is_default ? t('setup.pipe.cantDeleteDefault') : deals > 0 ? t('setup.pipe.cantDeleteDeals') : null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-foreground/[0.06] px-4 py-2">
      {/* On phones the tabs get a row of their own, so the chosen pipeline is never squeezed out of sight. */}
      <div role="tablist" aria-label={t('pipelines.select')} className="flex w-full min-w-0 gap-1 overflow-x-auto sm:w-auto sm:flex-1">
        {pipelines.map((p) => {
          const active = p.id === current?.id
          return (
            <button key={p.id} type="button" role="tab" aria-selected={active} onClick={() => onSelect(p.id)} title={p.is_default ? t('setup.pipe.defaultHint') : undefined}
              className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary/15 font-medium text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground')}>
              {p.is_default && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
              <span className="max-w-[180px] truncate">{labels.pipeline(p.name)}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{dealCount(p.id)}</span>
            </button>
          )
        })}
      </div>
      {current && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><IconButton label={t('setup.pipe.actions')}><MoreHorizontal /></IconButton></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="truncate">{name} · {t('setup.pipe.deals', { count: deals })}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setDialog('rename')}><Pencil /> {t('setup.pipe.rename')}</DropdownMenuItem>
            {!current.is_default && <DropdownMenuItem onSelect={makeDefault}><Star /> {t('pipelines.makeDefault')}</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!!blocked} onSelect={remove} className="text-rose-600 dark:text-rose-400"><Trash2 /> {t('setup.pipe.delete')}</DropdownMenuItem>
            {blocked && <p className="px-2 pb-1.5 text-[11px] text-muted-foreground">{blocked}</p>}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button size="sm" variant="outline" className="ml-auto sm:ml-0" onClick={() => setDialog('create')}><Plus /> {t('setup.pipe.newPipeline')}</Button>
      {dialog === 'create' && (
        <PipelineNameDialog open onOpenChange={() => setDialog(null)} title={t('setup.pipe.newPipeline')} description={t('setup.pipe.newPipelineDesc')} submitLabel={t('setup.pipe.create')}
          onSubmit={(value) => actions.create.mutate(value, { onSuccess: (p) => onSelect(p.id) })} />
      )}
      {dialog === 'rename' && current && (
        <PipelineNameDialog open onOpenChange={() => setDialog(null)} title={t('setup.pipe.rename')} initial={name} submitLabel={t('common.save')}
          onSubmit={(value) => actions.update.mutate({ id: current.id, patch: { name: value } })} />
      )}
    </div>
  )
}
