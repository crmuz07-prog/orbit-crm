import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth, useWorkspaceSession } from '@/auth/AuthProvider'
import { CompanyLogo } from '@/components/common/avatars'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { authApi } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

/** Slack / Linear-style switcher between the workspaces a user belongs to. */
export function WorkspaceSwitcher() {
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
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/5" disabled={workspaces.length < 2}>
        <CompanyLogo name={session.workspace.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{session.workspace.name}</span>
          <span className="block text-[11px] text-muted-foreground">{t(`roles.${session.role}`)}</span>
        </span>
        {workspaces.length > 1 && <ChevronsUpDown className="size-4 text-muted-foreground" />}
      </DropdownMenuTrigger>
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
