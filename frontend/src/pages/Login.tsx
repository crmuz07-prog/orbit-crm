import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { TextField } from '@/components/common/form-fields'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LoginShowcase } from '@/features/auth/LoginShowcase'
import { authApi } from '@/lib/api'
import { fadeUp, stagger } from '@/lib/motion'
import type { Token } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const run = async (request: () => Promise<Token>) => {
    setBusy(true)
    try {
      signIn(await request())
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(() => (mode === 'signin' ? authApi.login(form.email, form.password) : authApi.register(form.fullName, form.email, form.password)))
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="glass w-full max-w-md rounded-3xl p-8">
          <motion.div variants={fadeUp} className="mb-8 flex items-center justify-between"><Logo /><LanguageSwitcher /></motion.div>
          <motion.h1 variants={fadeUp} className="text-2xl font-semibold tracking-tight">{mode === 'signin' ? t('auth.welcome') : t('auth.create')}</motion.h1>
          <motion.p variants={fadeUp} className="mt-1 text-sm text-muted-foreground">
            {mode === 'signin' ? t('auth.signInSub') : t('auth.signUpSub')}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8">
            <Button variant="outline" className="w-full" disabled={busy} onClick={() => run(authApi.demo)}>
              {t('auth.demo')} <ArrowRight className="ml-auto" />
            </Button>
          </motion.div>
          <motion.div variants={fadeUp} className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> {t('auth.or')} <Separator className="flex-1" />
          </motion.div>

          <motion.form variants={fadeUp} onSubmit={submit} className="grid gap-4">
            {mode === 'signup' && <TextField label={t('auth.fullName')} required value={form.fullName} onChange={set('fullName')} placeholder="Alex Morgan" />}
            <TextField label={t('auth.email')} type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
            <TextField label={t('auth.password')} type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} />
            <Button type="submit" disabled={busy}>{busy ? t('common.pleaseWait') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}</Button>
          </motion.form>
          <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? t('auth.newHere') : t('auth.haveAccount')}{' '}
            <button className="font-medium text-primary hover:underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? t('auth.createAccount') : t('auth.signIn')}
            </button>
          </motion.p>
        </motion.div>
      </div>
      <LoginShowcase />
    </div>
  )
}
