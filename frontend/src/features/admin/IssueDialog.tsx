import type { ReactNode } from 'react'
import { CredentialsCard } from '@/components/common/credentials-card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Once set, the form is replaced by the credentials to hand over. */
  issued: { email: string; password: string } | null
  children: ReactNode
}

/** Dialog shared by every "issue a login" action: company owner, new user, password reset. */
export function IssueDialog({ open, onOpenChange, title, description, issued, children }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {issued ? <CredentialsCard email={issued.email} password={issued.password} /> : children}
      </DialogContent>
    </Dialog>
  )
}
