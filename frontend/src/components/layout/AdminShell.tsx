import { Outlet } from 'react-router-dom'
import { LogOut, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'

/** Layout for a superadmin who is not in any company: only the platform admin panel exists for them. */
export function AdminShell() {
  const { t } = useTranslation()
  const { session, signOut } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
        <Logo />
        <span className="ml-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> {t('admin.nav')}</span>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={t('nav.darkMode')}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>
          {session && <PersonAvatar name={session.user.full_name} />}
          <Button variant="ghost" size="icon" onClick={signOut} aria-label={t('nav.signOut')}><LogOut /></Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <p className="glass mb-6 rounded-xl px-4 py-3 text-sm text-muted-foreground">
          <b className="font-medium text-foreground">{t('admin.noWorkspaceTitle')}.</b> {t('admin.noWorkspaceDesc')}
        </p>
        <Outlet />
      </main>
    </div>
  )
}
