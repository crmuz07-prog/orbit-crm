import { useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { authApi } from '@/lib/api'
import { withRetry } from '@/lib/http'

type State = 'pending' | 'done' | 'failed'

const ICON = { pending: LoaderCircle, done: CircleCheck, failed: CircleAlert }

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const { session, updateUser } = useAuth()
  const token = useSearchParams()[0].get('token') ?? ''
  const [state, setState] = useState<State>('pending')
  const started = useRef(false)

  useEffect(() => {
    // StrictMode mounts twice in development; a token can only be used once.
    if (started.current) return
    started.current = true
    withRetry(() => authApi.verify(token))
      .then((user) => {
        if (session?.user.id === user.id) updateUser(user)
        setState('done')
      })
      .catch(() => setState('failed'))
  }, [token, session, updateUser])

  const Icon = ICON[state]
  const title = state === 'pending' ? t('account.verifyTitle') : state === 'done' ? t('account.verified') : t('account.verifyFailed')

  return (
    <AuthLayout title={title} subtitle={state === 'done' ? t('account.verifiedSub') : undefined}>
      <div className="flex justify-center py-4">
        <Icon className={state === 'pending' ? 'size-10 animate-spin text-muted-foreground' : state === 'done' ? 'size-10 text-emerald-500' : 'size-10 text-rose-500'} />
      </div>
      {state !== 'pending' && <Button asChild className="w-full"><Link to="/">{t('account.openApp')}</Link></Button>}
    </AuthLayout>
  )
}
