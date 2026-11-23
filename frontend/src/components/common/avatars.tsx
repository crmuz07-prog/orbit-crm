import { cn, initials } from '@/lib/utils'

const PALETTE = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
]

const SIZES = { xs: 'size-5 text-[9px]', sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-14 text-lg' }
type Size = keyof typeof SIZES

const colorFor = (name: string) => PALETTE[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % PALETTE.length]

function Initials({ text, name, size, square, className }: { text: string; name: string; size: Size; square?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 select-none items-center justify-center font-semibold', square ? 'rounded-lg ring-1 ring-inset ring-black/5' : 'rounded-full', colorFor(name), SIZES[size], className)}>
      {text}
    </span>
  )
}

export const PersonAvatar = ({ name, size = 'sm', className }: { name: string; size?: Size; className?: string }) => (
  <Initials text={initials(name)} name={name} size={size} className={className} />
)

export const CompanyLogo = ({ name, size = 'sm', className }: { name: string; size?: Size; className?: string }) => (
  <Initials text={name.trim()[0]?.toUpperCase() ?? '?'} name={name} size={size} square className={className} />
)
