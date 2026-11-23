export function Logo({ withName = true }: { withName?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <circle cx="16" cy="16" r="6" fill="none" stroke="#fff" strokeWidth="3" />
        <circle cx="24" cy="9" r="2.5" fill="#c7d2fe" />
      </svg>
      {withName && <span className="text-[15px] font-semibold tracking-tight">Orbit</span>}
    </div>
  )
}
