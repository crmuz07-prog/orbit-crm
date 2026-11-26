import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUpdateRow } from '@/hooks/useData'
import { STAGE_COLORS } from '@/lib/constants'
import type { Stage, StageColor } from '@/lib/types'
import { cn } from '@/lib/utils'

/** One dot showing the stage colour; the palette opens on click instead of eight dots on every row. */
export function StageColorPicker({ stage }: { stage: Stage }) {
  const { t } = useTranslation()
  const update = useUpdateRow('pipeline_stages')
  return (
    <Popover>
      <PopoverTrigger className={cn('size-5 shrink-0 rounded-full ring-offset-2 ring-offset-card transition hover:ring-2 hover:ring-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', STAGE_COLORS[stage.color].dot)}
        aria-label={t('setup.color')} title={t('setup.color')} />
      <PopoverContent align="start" className="flex w-auto gap-1.5 p-2">
        {(Object.keys(STAGE_COLORS) as StageColor[]).map((c) => (
          <button key={c} type="button" aria-label={c} onClick={() => update.mutate({ id: stage.id, patch: { color: c } })}
            className={cn('size-5 rounded-full transition', STAGE_COLORS[c].dot, stage.color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'opacity-60 hover:opacity-100')} />
        ))}
      </PopoverContent>
    </Popover>
  )
}
