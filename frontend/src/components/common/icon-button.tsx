import { forwardRef } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

type Props = Omit<ButtonProps, 'size' | 'aria-label'> & {
  /** Read by screen readers and shown as a small tooltip on hover / focus. */
  label: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** The one icon-only button: an icon, its tooltip and its accessible name come from a single `label`. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(({ label, side, variant = 'ghost', children, ...props }, ref) => (
  <Tooltip content={label} side={side}>
    <Button ref={ref} variant={variant} size="icon" aria-label={label} {...props}>{children}</Button>
  </Tooltip>
))
IconButton.displayName = 'IconButton'
