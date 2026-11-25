import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/components/common/confirm-provider'
import { ActivityIcon } from '@/features/activities/ActivityIcon'
import { ActivityMeta } from '@/features/activities/ActivityLinks'
import { useSubject } from '@/features/activities/useSubject'
import { useUpdateRow } from '@/hooks/useData'
import { BUCKETS, bucketOf, isDropTarget, rescheduled, type Bucket } from '@/lib/tasks'
import type { Activity } from '@/lib/types'
import { cn, relativeDay } from '@/lib/utils'

function TaskCard({ task, overlay }: { task: Activity; overlay?: boolean }) {
  const subject = useSubject()
  return (
    <div className={cn('rounded-lg bg-card/80 p-2.5 text-[13px] shadow-sm ring-1 ring-foreground/[0.06] dark:bg-white/[0.06]', overlay && 'rotate-[1.5deg] shadow-xl ring-2 ring-primary/30')}>
      <div className="flex items-start gap-2">
        <ActivityIcon type={task.type} className="size-6" />
        <p className="min-w-0 flex-1 font-medium leading-snug">{subject(task)}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground"><ActivityMeta activity={task} /></div>
    </div>
  )
}

function DraggableTask({ task }: { task: Activity }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return <div ref={setNodeRef} {...attributes} {...listeners} className={cn('cursor-grab touch-none', isDragging && 'opacity-30')}><TaskCard task={task} /></div>
}

function Column({ bucket, tasks }: { bucket: Bucket; tasks: Activity[] }) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: bucket, disabled: !isDropTarget(bucket) })
  return (
    <div className="flex w-[248px] shrink-0 flex-col">
      <h3 className={cn('mb-2 px-1 text-center text-[12px] font-bold uppercase tracking-wider', bucket === 'overdue' && 'text-rose-600 dark:text-rose-400')}>
        {t(`tasks.buckets.${bucket}`)} <span className="font-normal text-muted-foreground">· {tasks.length}</span>
      </h3>
      <div ref={setNodeRef} className={cn('flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl p-1.5 transition-colors', isOver ? 'bg-primary/10 ring-1 ring-primary/40' : 'glass-subtle')}>
        {tasks.map((task) => <DraggableTask key={task.id} task={task} />)}
      </div>
    </div>
  )
}

/** Tasks as columns by deadline; dropping a card on Today / Tomorrow / This week / Later reschedules it after a confirmation. */
export function TaskBoard({ tasks }: { tasks: Activity[] }) {
  const { t } = useTranslation()
  const subject = useSubject()
  const confirm = useConfirm()
  const update = useUpdateRow('activities')
  const [active, setActive] = useState<Activity | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const open = tasks.filter((a) => !a.done)

  const onDragEnd = async ({ active: dragged, over }: DragEndEvent) => {
    setActive(null)
    const task = open.find((a) => a.id === dragged.id)
    const target = over ? (String(over.id) as Bucket) : null
    if (!task || !target || bucketOf(task) === target) return
    const due = rescheduled(task, target)
    if (!due) return
    const ok = await confirm({ title: t('tasks.move.title', { when: relativeDay(due.toISOString()) }), description: subject(task), confirmLabel: t('tasks.move.action'), tone: 'default' })
    if (ok) update.mutate({ id: task.id, patch: { due_at: due.toISOString() } }, { onSuccess: () => toast.success(t('tasks.move.done')) })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e) => setActive(open.find((a) => a.id === e.active.id) ?? null)} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
      <div className="-mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] pb-3">
        {BUCKETS.map((b) => <Column key={b} bucket={b} tasks={open.filter((a) => bucketOf(a) === b)} />)}
      </div>
      <DragOverlay dropAnimation={null}>{active && <TaskCard task={active} overlay />}</DragOverlay>
    </DndContext>
  )
}
