import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
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
}

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
export function DataTable<T extends { id: string }>({ rows, columns, onRowClick, empty, initialSort = null }: DataTableProps<T>) {
  const [sort, setSort] = useState<Sort>(initialSort)
  const sorted = useSorted(rows, columns, sort)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-foreground/[0.06]">
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
              className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-foreground/[0.03]')}
            >
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
