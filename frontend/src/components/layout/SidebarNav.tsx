import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { spring } from '@/lib/motion'
import type { Module } from '@/lib/types'
import { cn } from '@/lib/utils'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number; module?: Module }
export type NavProps = { onNavigate?: () => void; collapsed?: boolean }

/** One sidebar link; collapsed it is just the icon, with the name as a tooltip and the badge on the corner. */
export function NavItemLink({ to, label, icon: Icon, end, badge, onNavigate, collapsed }: NavItem & NavProps) {
  const link = (
    <NavLink to={to} end={end} onClick={onNavigate} aria-label={collapsed ? label : undefined} className="relative block">
      {({ isActive }) => (
        <span className={cn('relative flex h-8 items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors', collapsed ? 'justify-center px-0' : 'px-2',
          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
          {/* Shared layoutId slides the highlight between items (Linear-style). */}
          {isActive && <motion.span layoutId="nav-active" transition={spring} className="glass absolute inset-0 rounded-lg" />}
          <Icon className="relative size-4 shrink-0 opacity-80" />
          {!collapsed && <span className="relative flex-1 truncate">{label}</span>}
          {!!badge && (
            <span className={cn('relative rounded-full bg-rose-500/15 text-[10px] font-semibold tabular-nums text-rose-600 dark:text-rose-400',
              collapsed ? 'absolute -right-0.5 -top-0.5 min-w-4 px-1 text-center' : 'px-1.5')}>{badge}</span>
          )}
        </span>
      )}
    </NavLink>
  )
  return collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link
}

export function NavSection({ title, items, onNavigate, collapsed }: { title?: string; items: NavItem[] } & NavProps) {
  if (items.length === 0) return null
  return (
    <nav className="flex flex-col gap-0.5">
      {title && !collapsed && <p className="mb-0.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>}
      {title && collapsed && <span className="mx-auto mb-1 h-px w-5 bg-foreground/10" aria-hidden />}
      {items.map((item) => <NavItemLink key={item.to} {...item} onNavigate={onNavigate} collapsed={collapsed} />)}
    </nav>
  )
}
