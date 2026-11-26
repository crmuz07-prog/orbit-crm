import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/common/icon-button'
import { Badge } from '@/components/ui/badge'
import { useLabels } from '@/hooks/useLabels'
import { STAGE_COLORS } from '@/lib/constants'
import type { Stage } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StageDeleteDialog } from './StageDeleteDialog'
import { StageDialog } from './StageDialog'

interface ItemProps {
  stage: Stage
  siblings: Stage[]
  dealCount: number
}

type Drag = ReturnType<typeof useSortable>

/** One stage as a readable line — colour, name, what is set (chance, day limit, note), deals; edit opens the dialog. */
function StageItem({ stage, siblings, dealCount, drag }: ItemProps & { drag?: Drag }) {
  const { t } = useTranslation()
  const name = useLabels().stage(stage.name)
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)
  const closed = stage.is_won || stage.is_lost
  const style = drag ? { transform: CSS.Transform.toString(drag.transform), transition: drag.transition } : undefined

  return (
    <li ref={drag?.setNodeRef} style={style} className={cn('flex items-center gap-2 bg-card px-4 py-2', drag?.isDragging && 'relative z-10 shadow-lg')}>
      {drag ? (
        <button type="button" {...drag.attributes} {...drag.listeners} aria-label={t('setup.stage.reorder')} title={t('setup.stage.reorder')}
          className="-my-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing">
          <GripVertical className="size-4" />
        </button>
      ) : <span className="w-6" />}
      <span className={cn('size-3 shrink-0 rounded-full', STAGE_COLORS[stage.color].dot)} />
      <button type="button" onClick={() => setDialog('edit')} className="min-w-0 flex-1 text-left focus-visible:outline-none">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-medium hover:underline">{name}</span>
          {closed && <Badge tone={stage.is_won ? 'green' : 'red'}>{stage.is_won ? t('settings.wonStage') : t('settings.lostStage')}</Badge>}
          {!closed && <span className="text-xs tabular-nums text-muted-foreground">{t('setup.stage.chipChance', { n: stage.probability })}</span>}
          {stage.max_days && <span className="text-xs text-muted-foreground">· {t('setup.stage.chipDays', { n: stage.max_days })}</span>}
        </span>
        {stage.description && <span className="block truncate text-xs text-muted-foreground">{stage.description}</span>}
      </button>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t('settings.dealCount', { count: dealCount })}</span>
      <IconButton label={t('setup.stage.edit')} onClick={() => setDialog('edit')}><Pencil /></IconButton>
      <IconButton label={t('settings.deleteStage')} onClick={() => setDialog('delete')}><Trash2 /></IconButton>
      {dialog === 'edit' && <StageDialog open onOpenChange={() => setDialog(null)} stage={stage} pipelineId={stage.pipeline_id} position={stage.position} />}
      {dialog === 'delete' && <StageDeleteDialog open onOpenChange={() => setDialog(null)} stage={stage} siblings={siblings} dealCount={dealCount} />}
    </li>
  )
}

/** A working stage: the same line with a drag handle (only these live inside the sortable context). */
function SortableStageItem(props: ItemProps) {
  return <StageItem {...props} drag={useSortable({ id: props.stage.id })} />
}

interface Props {
  open: Stage[]
  closed: Stage[]
  dealCount: (stage: Stage) => number
  /** New order of the working stages. */
  onReorder: (stages: Stage[]) => void
}

/** Working stages (drag to reorder, mouse or keyboard) and the final won / lost stages, each group explained. */
export function StageList({ open, closed, dealCount, onReorder }: Props) {
  const { t } = useTranslation()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const all = [...open, ...closed]
  const labels = useLabels()
  // Screen readers hear stage names, not ids, while a stage is dragged with the keyboard.
  const nameOf = (id: string | number | undefined) => labels.stage(all.find((s) => s.id === id)?.name ?? '')
  const accessibility = {
    screenReaderInstructions: { draggable: t('setup.stage.a11y.instructions') },
    announcements: {
      onDragStart: ({ active }: { active: { id: string | number } }) => t('setup.stage.a11y.start', { name: nameOf(active.id) }),
      onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => (over ? t('setup.stage.a11y.over', { name: nameOf(active.id), over: nameOf(over.id) }) : undefined),
      onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => (over ? t('setup.stage.a11y.end', { name: nameOf(active.id), over: nameOf(over.id) }) : undefined),
      onDragCancel: ({ active }: { active: { id: string | number } }) => t('setup.stage.a11y.cancel', { name: nameOf(active.id) }),
    },
  }
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(open, open.findIndex((s) => s.id === active.id), open.findIndex((s) => s.id === over.id)))
  }
  const heading = (title: string, hint: string) => (
    <div className="border-b border-foreground/[0.06] bg-foreground/[0.02] px-4 py-1.5">
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
  return (
    <>
      {heading(t('setup.openStages'), t('setup.stage.dragHint'))}
      {open.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">{t('setup.stage.empty')}</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end} accessibility={accessibility}>
          <SortableContext items={open.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-foreground/[0.06]">
              {open.map((s) => <SortableStageItem key={s.id} stage={s} siblings={all} dealCount={dealCount(s)} />)}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {heading(t('setup.closedStages'), t('setup.closedHint'))}
      <ul className="divide-y divide-foreground/[0.06]">
        {closed.map((s) => <StageItem key={s.id} stage={s} siblings={all} dealCount={dealCount(s)} />)}
      </ul>
    </>
  )
}
