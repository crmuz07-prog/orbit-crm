import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
}

type Sort = { key: string; dir: 'asc' | 'desc' } | null

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  empty?: ReactNode
  initialSort?: Sort
  /** Px the table keeps before scrolling sideways; list pages need room, small report cards do not. */
  minWidth?: number
  /** Checkbox column for bulk actions (amoCRM lists): the ids of checked rows. */
  selection?: Selection
}

/** Checked row ids; `onChange` is a state setter so quick successive clicks never lose one. */
export type Selection = { selected: Set<string>; onChange: Dispatch<SetStateAction<Set<string>>> }

const boxClass = 'rounded-[4px] border-foreground/30 hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary'

function compare(a: string | number, b: string | number) {
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
}

function useSorted<T>(rows: T[], columns: Column<T>[], sort: Sort) {
  return useMemo(() => {
    const get = sort && columns.find((c) => c.key === sort.key)?.sortValue
    if (!sort || !get) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => dir * compare(get(a), get(b)))
  }, [rows, columns, sort])
}

const nextSort = (sort: Sort, key: string): Sort =>
  sort?.key !== key ? { key, dir: 'asc' } : sort.dir === 'asc' ? { key, dir: 'desc' } : null

function SortIcon({ active, dir }: { active: boolean; dir?: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="size-3 opacity-40" />
  return dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
}

/** Sortable table used by every list page (Attio-style dense rows). */
export function DataTable<T extends { id: string }>({ rows, columns, onRowClick, empty, initialSort = null, minWidth = 720, selection }: DataTableProps<T>) {
  const [sort, setSort] = useState<Sort>(initialSort)
  const sorted = useSorted(rows, columns, sort)
  const { t } = useTranslation()
  const checked = selection ? sorted.filter((r) => selection.selected.has(r.id)).length : 0
  const toggleAll = () => selection?.onChange(new Set(checked === sorted.length ? [] : sorted.map((r) => r.id)))
  const toggle = (id: string) => selection?.onChange((prev) => {
    const next = new Set(prev)
    if (!next.delete(id)) next.add(id)
    return next
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-foreground/[0.06]">
            {selection && (
              <th className="w-8 pl-3">
                <Checkbox aria-label={t('common.selectAll')} className={boxClass} onCheckedChange={toggleAll}
                  checked={checked > 0 && checked === sorted.length ? true : checked > 0 ? 'indeterminate' : false} />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className={cn('whitespace-nowrap px-3 py-2 text-[11px] font-medium text-muted-foreground', c.align === 'right' ? 'text-right' : 'text-left')}>
                {c.sortValue ? (
                  <button type="button" onClick={() => setSort(nextSort(sort, c.key))} className={cn('inline-flex items-center gap-1 hover:text-foreground', c.align === 'right' && 'flex-row-reverse')}>
                    {c.header}
                    <SortIcon active={sort?.key === c.key} dir={sort?.dir} />
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/[0.06]">
          {sorted.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i, 12) * 0.015 }}
              onClick={onRowClick && (() => onRowClick(row))}
              className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-foreground/[0.03]', selection?.selected.has(row.id) && 'bg-primary/[0.06]')}
            >
              {selection && (
                // The whole cell toggles: an 18 px box alone is too small a target (and the row click would open the record).
                <td className="w-8 cursor-pointer pl-3" onClick={(e) => { e.stopPropagation(); toggle(row.id) }}>
                  <Checkbox aria-label={t('common.select')} className={boxClass} checked={selection.selected.has(row.id)} onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(row.id) }} />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={cn('whitespace-nowrap px-3 py-2', c.align === 'right' && 'text-right tabular-nums')}>{c.cell(row)}</td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && empty}
    </div>
  )
}
