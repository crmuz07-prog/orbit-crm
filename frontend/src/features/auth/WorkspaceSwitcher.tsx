import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth, useWorkspaceSession } from '@/auth/AuthProvider'
import { CompanyLogo } from '@/components/common/avatars'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { authApi } from '@/lib/api'
import { cn, errorMessage } from '@/lib/utils'

/** Slack / Linear-style switcher between the workspaces a user belongs to. */
export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { switchTo } = useAuth()
  const session = useWorkspaceSession()
  const navigate = useNavigate()
  const { data: workspaces = [] } = useQuery({ queryKey: ['workspaces', session?.user.id], queryFn: authApi.workspaces })

  const choose = async (id: string, name: string) => {
    if (id === session.workspace.id) return
    try {
      switchTo(await authApi.switch(id))
      navigate('/')
      toast.success(t('account.switched', { workspace: name }))
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <DropdownMenu>
      {/* The company name only: the person's role is not something they need to read on every screen. */}
      <Tooltip content={session.workspace.name} side="right">
      <DropdownMenuTrigger disabled={workspaces.length < 2}
        className={cn('flex min-w-0 items-center gap-2 rounded-lg py-1 text-left transition-colors hover:bg-foreground/5 disabled:hover:bg-transparent', compact ? 'justify-center px-0' : 'flex-1 px-1.5')}>
        <CompanyLogo name={session.workspace.name} size="sm" />
        {!compact && <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{session.workspace.name}</span>}
        {!compact && workspaces.length > 1 && <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />}
      </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t('account.workspaces')}</DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onSelect={() => choose(w.id, w.name)}>
            <CompanyLogo name={w.name} size="xs" />
            <span className="min-w-0 flex-1 truncate">{w.name}</span>
            {w.id === session.workspace.id && <Check />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
