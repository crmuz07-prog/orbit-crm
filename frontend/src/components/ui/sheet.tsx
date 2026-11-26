import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { overlayClass } from './dialog'

export const Sheet = DialogPrimitive.Root
export const SheetTitle = DialogPrimitive.Title

const SIDES = {
  left: 'left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
  right: 'right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
}

type Props = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: keyof typeof SIDES }

/** Drawer from a screen edge: the mobile navigation (left), the settings sections (right). */
export const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, Props>(
  ({ className, side = 'left', ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(
          'glass-strong fixed inset-y-0 z-50 w-72 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
          SIDES[side],
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  ),
)
SheetContent.displayName = DialogPrimitive.Content.displayName
