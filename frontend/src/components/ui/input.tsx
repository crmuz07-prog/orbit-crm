import * as React from 'react'
import { cn } from '@/lib/utils'

export const controlClass =
  'glass-subtle w-full rounded-lg text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlClass, 'h-9 px-3 py-1', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(controlClass, 'min-h-[80px] resize-y px-3 py-2', className)} {...props} />
))
Textarea.displayName = 'Textarea'
