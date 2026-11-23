import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { overlayClass } from './dialog'

export const Sheet = DialogPrimitive.Root
export const SheetTitle = DialogPrimitive.Title

/** Left-side drawer used for the mobile navigation. */
export const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(
          'glass-strong fixed inset-y-0 left-0 z-50 w-72 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  ),
)
SheetContent.displayName = DialogPrimitive.Content.displayName
