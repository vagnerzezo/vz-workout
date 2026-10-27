import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { parseLoginId, passwordRules } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useNow } from '../../../shared/hooks/use-now'
import { useBranding, useResetPassword, useStartRecovery, useVerifyRecovery, type AuthError } from '../api/session'
import { FormError, PasswordInput, PasswordRules, field } from '../components/auth-fields'

const RESEND_SECONDS = 45
const back =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'
const submitButton = 'h-13.5 rounded-full text-base font-extrabold disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100'

type Step = 'login' | 'code' | 'password' | 'done'

/** Recuperar senha: celular ou e-mail → código de 6 números → senha nova (e já entra). */
export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('login')
  const [user, setUser] = useState('')
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [sentTo, setSentTo] = useState('')
  const [sentAt, setSentAt] = useState(0)
  const [token, setToken] = useState('')
  const start = useStartRecovery()

  const send = () =>
    start.mutate(
      { login: user, channel },
      {
        onSuccess: ({ sentTo }) => {
          setSentTo(sentTo)
          setSentAt(Date.now())
          setStep('code')
        },
      },
    )

  const stepLabel = { login: 'Recuperar senha', code: 'Passo 2 de 3', password: 'Passo 3 de 3', done: '' }[step]

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 px-6 pt-[max(20px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      {step !== 'done' && (
        <header className="flex items-center gap-2.5">
          {step === 'login' ? (
            <Link to="/entrar" aria-label="Voltar para entrar" className={back}>
              <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
            </Link>
          ) : (
            <button type="button" aria-label="Voltar" className={back} onClick={() => setStep(step === 'password' ? 'code' : 'login')}>
              <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
            </button>
          )}
          <span className="text-[13px] font-bold text-muted-foreground">{stepLabel}</span>
        </header>
      )}

      {step === 'login' && (
        <LoginStep user={user} setUser={setUser} channel={channel} setChannel={setChannel} onSend={send} sending={start.isPending} />
      )}
      {step === 'code' && (
        <CodeStep
          sentTo={sentTo}
          sentAt={sentAt}
          onResend={send}
          onVerified={(t) => {
            setToken(t)
            setStep('password')
          }}
        />
      )}
      {step === 'password' && <PasswordStep token={token} onSaved={() => setStep('done')} onExpired={() => setStep('login')} />}
      {step === 'done' && <Done />}
    </main>
  )
}

function Title({ children, sub }: { children: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[26px] font-extrabold tracking-[-0.4px]">{children}</h1>
      <p className="text-sm leading-normal text-muted-foreground">{sub}</p>
    </div>
  )
}

function LoginStep(props: {
  user: string
  setUser: (v: string) => void
  channel: 'whatsapp' | 'email'
  setChannel: (v: 'whatsapp' | 'email') => void
  onSend: () => void
  sending: boolean
}) {
  const ok = !!parseLoginId(props.user)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (ok) props.onSend()
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Title sub="Enviamos um código de 6 números para você criar uma nova.">Esqueceu a senha?</Title>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rec-usuario" className="text-[13px] font-bold text-foreground-2">
          Celular ou e-mail cadastrado
        </label>
        <input
          id="rec-usuario"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          value={props.user}
          onChange={(e) => props.setUser(e.target.value)}
          className={field}
        />
      </div>
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="sr-only">Receber o código por</legend>
        {(
          [
            ['whatsapp', 'WhatsApp'],
            ['email', 'E-mail'],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={cn(
              'flex h-12 cursor-pointer items-center justify-center rounded-[14px] border text-[13.5px] font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              props.channel === value ? 'border-primary bg-primary/14 text-primary' : 'bg-card text-foreground-2',
            )}
          >
            <input type="radio" name="canal" className="sr-only" checked={props.channel === value} onChange={() => props.setChannel(value)} />
            {label}
          </label>
        ))}
      </fieldset>
      <Button type="submit" size="xl" disabled={!ok || props.sending} className={submitButton}>
        {props.sending ? 'Enviando…' : 'Enviar código'}
      </Button>
      <p className="text-xs leading-normal text-muted-foreground">Por segurança, mostramos a mesma mensagem mesmo se o cadastro não existir.</p>
    </form>
  )
}

function CodeStep({ sentTo, sentAt, onResend, onVerified }: { sentTo: string; sentAt: number; onResend: () => void; onVerified: (token: string) => void }) {
  const [code, setCode] = useState('')
  const verify = useVerifyRecovery()
  const now = useNow(1000)
  const wait = Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000))
  const error = verify.error as AuthError | null

  const change = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    if (digits.length === 6)
      verify.mutate(digits, {
        onSuccess: ({ token }) => onVerified(token),
        onError: () => setCode(''), // limpa para digitar de novo
      })
  }

  return (
    <div className="flex flex-col gap-5">
      <Title sub={`Enviamos ${sentTo}. Ele vale por 10 minutos.`}>Digite o código</Title>
      <label className="flex flex-col gap-2">
        <span className="sr-only">Código de 6 números</span>
        <span aria-hidden="true" className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className={cn('flex h-14.5 items-center justify-center rounded-[14px] border bg-card text-2xl font-extrabold', i === code.length && 'border-primary')}
            >
              {code[i] ?? ''}
            </span>
          ))}
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          disabled={verify.isPending}
          onChange={(e) => change(e.target.value)}
          placeholder="toque para digitar"
          className="h-12 rounded-[14px] border border-dashed border-line-strong bg-transparent text-center text-[15px] tracking-[4px] text-foreground-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      {error && (
        <FormError>
          {error.status === 429
            ? error.message
            : error.attemptsLeft === 1
              ? 'Código incorreto. Você tem mais 1 tentativa.'
              : `Código incorreto. Você tem mais ${error.attemptsLeft} tentativas.`}
        </FormError>
      )}
      <button
        type="button"
        disabled={wait > 0}
        onClick={() => {
          verify.reset()
          onResend()
        }}
        className="h-11 rounded-full text-sm font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:text-muted-foreground"
      >
        {wait > 0 ? `Reenviar código em 0:${String(wait).padStart(2, '0')}` : 'Reenviar código'}
      </button>
    </div>
  )
}

function PasswordStep({ token, onSaved, onExpired }: { token: string; onSaved: () => void; onExpired: () => void }) {
  const [password, setPassword] = useState('')
  const reset = useResetPassword()
  const rules = passwordRules(password)
  const ok = rules.every((r) => r.ok)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!ok) return
    reset.mutate(
      { token, password },
      { onSuccess: onSaved, onError: (err) => (err as AuthError).status === 410 && onExpired() },
    )
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Title sub="Ao salvar, você sai dos outros aparelhos.">Nova senha</Title>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rec-senha" className="text-[13px] font-bold text-foreground-2">
          Nova senha
        </label>
        <PasswordInput id="rec-senha" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <PasswordRules rules={rules} />
      {reset.error && (reset.error as AuthError).status !== 410 && <FormError>Não foi possível salvar. Tente de novo.</FormError>}
      <Button type="submit" size="xl" disabled={!ok || reset.isPending} className={submitButton}>
        {reset.isPending ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </form>
  )
}

function Done() {
  const coachFirst = useBranding().data?.coachName.split(' ')[0] ?? 'treinador'
  return (
    <div className="mt-20 flex flex-col items-center gap-3.5 text-center">
      <span aria-hidden="true" className="flex size-19 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-8.5" strokeWidth={2.8} />
      </span>
      <h1 className="text-2xl font-extrabold">Senha alterada</h1>
      <p className="text-sm leading-normal text-muted-foreground">Avisamos por e-mail que a senha mudou. Se não foi você, fale com o {coachFirst}.</p>
      <Link
        to="/"
        replace
        className="mt-2.5 flex h-13.5 w-full items-center justify-center rounded-full bg-primary text-base font-extrabold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Entrar no app
      </Link>
    </div>
  )
}
