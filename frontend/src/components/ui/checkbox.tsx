import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Round "complete task" checkbox (HubSpot / Asana style). */
export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'peer flex size-[18px] shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 transition-all hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=checked]:scale-105 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="animate-in zoom-in-50">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName
