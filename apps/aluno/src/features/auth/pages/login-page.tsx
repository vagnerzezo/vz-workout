import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { MIN_PASSWORD, initials, parseLoginId } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { useMe } from '../../../shared/api/me'
import { useBranding, useLogin, type AuthError } from '../api/session'
import { FormError, PasswordInput, field } from '../components/auth-fields'

export default function LoginPage() {
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const me = useMe()
  const branding = useBranding().data
  const login = useLogin()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [tried, setTried] = useState(false)

  // Já entrou (ou acabou de entrar): vai para onde estava, o mesmo destino do navigate depois do login
  if (me.data) return <Navigate to={from} replace />

  const userOk = !!parseLoginId(user)
  const passwordOk = password.length >= MIN_PASSWORD
  const validation = !tried
    ? null
    : !userOk
      ? 'Digite seu celular com DDD (11 números) ou seu e-mail.'
      : !passwordOk
        ? `A senha tem pelo menos ${MIN_PASSWORD} caracteres.`
        : null
  const error = validation ?? (login.error ? (login.error as AuthError).message : null)
  const coachFirst = branding?.coachName.split(' ')[0] ?? 'treinador'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!userOk || !passwordOk) return
    login.mutate({ login: user, password }, { onSuccess: () => navigate(from, { replace: true }) })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-6 px-6 pt-[max(56px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <header className="flex flex-col items-center gap-3 text-center">
        <span aria-hidden="true" className="flex size-19 items-center justify-center rounded-[22px] bg-primary text-[26px] font-extrabold text-primary-foreground">
          {branding ? initials(branding.appName) : ''}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-extrabold tracking-[-0.4px]">{branding?.appName ?? 'Entrar'}</h1>
          {branding && <p className="text-sm text-muted-foreground">Treino e dieta com {branding.coachName}</p>}
        </div>
      </header>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-usuario" className="text-[13px] font-bold text-foreground-2">
            Celular ou e-mail
          </label>
          <input
            id="login-usuario"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            aria-invalid={tried && !userOk}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-senha" className="text-[13px] font-bold text-foreground-2">
            Senha
          </label>
          <PasswordInput
            id="login-senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={tried && userOk && !passwordOk}
          />
        </div>
        {error && <FormError>{error}</FormError>}
        <Link to="/recuperar-senha" className="flex min-h-8 items-center self-end rounded-md text-[13.5px] font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Esqueci minha senha
        </Link>
        <Button type="submit" size="xl" disabled={login.isPending} className="h-13.5 rounded-full text-base font-extrabold">
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <section aria-labelledby="primeiro" className="mt-auto flex flex-col gap-2.5 rounded-[18px] border bg-card p-3.5">
        <h2 id="primeiro" className="text-sm font-extrabold">
          É seu primeiro acesso?
        </h2>
        <p className="text-[12.5px] leading-[1.45] text-muted-foreground">Use o link ou o código que o {coachFirst} enviou para você criar sua senha.</p>
        <Link
          to="/primeiro-acesso"
          className="flex h-11.5 items-center justify-center rounded-full border border-line-strong text-sm font-extrabold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Tenho um código de acesso
        </Link>
      </section>
      <p className="text-center text-xs text-muted-foreground">Ainda não é aluno? Fale com o {coachFirst} pelo WhatsApp.</p>
    </main>
  )
}
