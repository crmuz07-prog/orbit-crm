import { Check, ChevronDown, Workflow } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Pipeline } from '@/lib/types'

/** amoCRM "voronka" picker at the top of the board. */
export function PipelineSwitcher({ pipelines, current, onChange }: { pipelines: Pipeline[]; current?: Pipeline; onChange: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-[260px] justify-between">
          <Workflow className="text-primary" />
          <span className="truncate font-semibold uppercase tracking-wide">{current?.name}</span>
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
        {pipelines.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => onChange(p.id)}>
            <span className="flex-1 truncate">{p.name}</span>
            {p.id === current?.id && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
