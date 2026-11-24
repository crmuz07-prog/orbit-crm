import * as React from 'react'
import * as AlertPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'
import { overlayClass, popupClass } from './dialog'

export const AlertDialog = AlertPrimitive.Root
export const AlertDialogTitle = AlertPrimitive.Title

export const AlertDialogContent = React.forwardRef<React.ElementRef<typeof AlertPrimitive.Content>, React.ComponentPropsWithoutRef<typeof AlertPrimitive.Content>>(
  ({ className, ...props }, ref) => (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className={overlayClass} />
      <AlertPrimitive.Content ref={ref} className={cn(popupClass, 'max-w-md', className)} {...props} />
    </AlertPrimitive.Portal>
  ),
)
AlertDialogContent.displayName = AlertPrimitive.Content.displayName

export const AlertDialogDescription = React.forwardRef<React.ElementRef<typeof AlertPrimitive.Description>, React.ComponentPropsWithoutRef<typeof AlertPrimitive.Description>>(
  ({ className, ...props }, ref) => <AlertPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />,
)
AlertDialogDescription.displayName = AlertPrimitive.Description.displayName

export const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertPrimitive.Action> & { variant?: 'destructive' | 'default' }
>(({ className, variant = 'destructive', ...props }, ref) => <AlertPrimitive.Action ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />)
AlertDialogAction.displayName = AlertPrimitive.Action.displayName

export const AlertDialogCancel = React.forwardRef<React.ElementRef<typeof AlertPrimitive.Cancel>, React.ComponentPropsWithoutRef<typeof AlertPrimitive.Cancel>>(
  ({ className, ...props }, ref) => <AlertPrimitive.Cancel ref={ref} className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />,
)
AlertDialogCancel.displayName = AlertPrimitive.Cancel.displayName
