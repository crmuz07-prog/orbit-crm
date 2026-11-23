import { useId, type ReactNode } from 'react'
import type { Language } from '@/i18n'
import { cn } from '@/lib/utils'

// Inline SVG flags: emoji flags render as plain letters on Windows.

// Crescent and 12 stars (rows of 3, 4 and 5, right-aligned) on the blue band.
const UZ_STARS = [3, 4, 5].flatMap((count, row) => Array.from({ length: count }, (_, i) => [26 - 3 * i, 3 + 3.5 * row]))

function Uzbekistan() {
  return (
    <>
      <rect width="60" height="40" fill="#fff" />
      <rect width="60" height="13.3" fill="#0099B5" />
      <rect y="26.7" width="60" height="13.3" fill="#1EB53A" />
      <rect y="13.1" width="60" height="0.9" fill="#CE1126" />
      <rect y="26" width="60" height="0.9" fill="#CE1126" />
      <circle cx="7" cy="6.7" r="4.3" fill="#fff" />
      <circle cx="8.7" cy="6.7" r="3.7" fill="#0099B5" />
      {UZ_STARS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="#fff" />)}
    </>
  )
}

function Russia() {
  return (
    <>
      <rect width="60" height="13.4" fill="#fff" />
      <rect y="13.3" width="60" height="13.4" fill="#0039A6" />
      <rect y="26.6" width="60" height="13.4" fill="#D52B1E" />
    </>
  )
}

function UnitedKingdom({ clipId }: { clipId: string }) {
  return (
    <>
      <clipPath id={clipId}><path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" /></clipPath>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5" clipPath={`url(#${clipId})`} />
      <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="12" />
      <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="7" />
    </>
  )
}

export function Flag({ code, className }: { code: Language; className?: string }) {
  const id = useId()
  const flags: Record<Language, ReactNode> = { uz: <Uzbekistan />, ru: <Russia />, en: <UnitedKingdom clipId={`${id}-uk`} /> }
  return (
    <svg viewBox="0 0 60 40" aria-hidden className={cn('h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10', className)}>
      {flags[code]}
    </svg>
  )
}
