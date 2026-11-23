import * as React from 'react'
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = MenuPrimitive.Root
export const DropdownMenuTrigger = MenuPrimitive.Trigger

export const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof MenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>>(
  ({ className, sideOffset = 6, ...props }, ref) => (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'glass-strong z-50 min-w-[10rem] overflow-hidden rounded-xl p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  ),
)
DropdownMenuContent.displayName = MenuPrimitive.Content.displayName

export const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof MenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.Item
      ref={ref}
      className={cn('relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus:bg-foreground/5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground', className)}
      {...props}
    />
  ),
)
DropdownMenuItem.displayName = MenuPrimitive.Item.displayName

export const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
)

export const DropdownMenuSeparator = React.forwardRef<React.ElementRef<typeof MenuPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>>(
  ({ className, ...props }, ref) => <MenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />,
)
DropdownMenuSeparator.displayName = MenuPrimitive.Separator.displayName
