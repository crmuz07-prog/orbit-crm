import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAsyncAction } from '@/features/auth/useAsyncAction'
import { useAuthConfig } from '@/features/auth/useAuthConfig'
import { useFormErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/api'
import { withRetry } from '@/lib/http'
import type { Token } from '@/lib/types'
import { newPassword, rules } from '@/lib/validation'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const errors = useFormErrors<'fullName' | 'email' | 'password'>('login-form')
  const { busy, run } = useAsyncAction((e) => errors.fromApi(e, { full_name: 'fullName' }))
  const config = useAuthConfig()
  const [mode, setMode] = useState<Mode>('signin')
  // Closed (ERP-style) deployments: no sign-up, and password help comes from the administrator.
  const canSignUp = config?.registration_enabled ?? false
  const [form, setForm] = useState({ fullName: '', email: params.get('email') ?? '', password: '' })
  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    errors.clear(key)
  }

  // A sleeping free-tier API may refuse the first attempts; wrong credentials (401) fail at once.
  const enter = async (request: () => Promise<Token>) => {
    const token = await run(() => withRetry(request))
    if (!token) return
    signIn(token)
    navigate(params.get('next') ?? '/', { replace: true })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const signup = mode === 'signup'
    // Sign-in accepts any password length (admin-issued ones may be short); only new passwords follow the rule.
    const valid = errors.validate(form, {
      ...(signup ? { fullName: [rules.required()] } : {}),
      email: [rules.required(), rules.email()],
      password: signup ? newPassword() : [rules.required()],
    })
    if (!valid) return
    enter(() => (mode === 'signin' ? authApi.login(form.email, form.password) : authApi.register(form.fullName, form.email, form.password)))
  }

  return (
    <AuthLayout title={mode === 'signin' ? t('auth.welcome') : t('auth.create')} subtitle={mode === 'signin' ? t('auth.signInSub') : t('auth.signUpSub')}>
      {config?.demo_enabled && (
        <>
          <Button variant="outline" className="w-full" disabled={busy} onClick={() => enter(authApi.demo)}>
            {t('auth.demo')} <ArrowRight className="ml-auto" />
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> {t('auth.or')} <Separator className="flex-1" />
          </div>
        </>
      )}
      <form id="login-form" onSubmit={submit} noValidate className="grid gap-4">
        {mode === 'signup' && <TextField name="fullName" label={t('auth.fullName')} value={form.fullName} onChange={set('fullName')} error={errors.message('fullName')} placeholder={t('examples.personName')} />}
        <TextField name="email" label={t('auth.email')} type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.message('email')} placeholder={t('examples.email')} />
        <TextField name="password" label={t('auth.password')} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} error={errors.message('password')} />
        {mode === 'signin' && config?.email_enabled && <Link to="/forgot" className="-mt-2 justify-self-end text-xs font-medium text-primary hover:underline">{t('account.forgot')}</Link>}
        <Button type="submit" disabled={busy}>{busy ? t('common.pleaseWait') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}</Button>
      </form>
      {canSignUp ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? t('auth.newHere') : t('auth.haveAccount')}{' '}
          <button className="font-medium text-primary hover:underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? t('auth.createAccount') : t('auth.signIn')}
          </button>
        </p>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">{t('login.askAdmin')}</p>
      )}
    </AuthLayout>
  )
}
