import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Check, ClipboardCheck, Dumbbell, MessageCircle, Plus, Share, Utensils } from 'lucide-react'
import type { Anamnesis } from '@workspace/core'
import { formatInviteCode, initials, normalizeInviteCode, parseDecimal, passwordRules } from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { Button } from '@workspace/ui/components/button'
import { Textarea } from '@workspace/ui/components/textarea'
import { cn } from '@workspace/ui/lib/utils'
import { usePushNotifications } from '../../../shared/pwa/push'
import { install, isIos, useInstall } from '../../../shared/pwa/install'
import { useAcceptInvite, useBranding, useInvite, useSaveAnamnesis, type AuthError } from '../api/session'
import { FormError, PasswordInput, PasswordRules, field } from '../components/auth-fields'

const STEPS = ['Código', 'Senha', 'Sobre você', 'Instalar', 'Lembretes'] as const
const primary = 'h-13.5 grow rounded-full text-[15px] font-extrabold disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100'
const secondary = 'h-13.5 shrink-0 rounded-full border border-line-strong px-5 text-sm font-extrabold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

/** Primeiro acesso: código → senha → sobre você → instalar → lembretes (seção 13 do guia). O link do WhatsApp já traz o código. */
export default function FirstAccessPage() {
  const params = useParams()
  const [step, setStep] = useState(0)
  const [code, setCode] = useState(() => formatInviteCode(normalizeInviteCode(params.code ?? '')))
  const raw = normalizeInviteCode(code)
  const invite = useInvite(raw)
  const appName = useBranding().data?.appName ?? ''
  const firstName = invite.data?.fullName.split(' ')[0] ?? ''
  const coachFirst = invite.data?.coachName.split(' ')[0] ?? 'treinador'
  const done = step === STEPS.length

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4.5 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(110px+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">
          {initials(appName)}
        </span>
        <div className="flex grow flex-col gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">{done ? 'Concluído' : `Passo ${step + 1} de ${STEPS.length} · ${STEPS[step]}`}</span>
          <div
            role="progressbar"
            aria-label="Progresso do primeiro acesso"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={Math.min(step + 1, STEPS.length)}
            className="grid grid-cols-5 gap-1"
          >
            {STEPS.map((s, i) => (
              <span key={s} className={cn('h-1.25 rounded-full', i < step ? 'bg-primary' : i === step ? 'bg-foreground' : 'bg-secondary')} />
            ))}
          </div>
        </div>
      </header>

      {step === 0 && (
        <CodeStep
          appName={appName}
          coachFirst={coachFirst}
          code={code}
          setCode={setCode}
          state={raw.length < 6 ? 'typing' : invite.isPending ? 'checking' : invite.data ? 'ok' : 'invalid'}
          fullName={invite.data?.fullName}
          onNext={() => setStep(1)}
          fromLink={!!params.code}
        />
      )}
      {step === 1 && invite.data && <PasswordStep invite={invite.data} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
      {step === 2 && <AboutStep coachFirst={coachFirst} onNext={() => setStep(3)} />}
      {step === 3 && <InstallStep appName={appName} onNext={() => setStep(4)} />}
      {step === 4 && <RemindersStep coachFirst={coachFirst} onNext={() => setStep(5)} />}
      {done && <Done firstName={firstName} coachFirst={coachFirst} />}
    </main>
  )
}

function Title({ children, sub }: { children: ReactNode; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.4px]">{children}</h1>
      <p className="text-sm leading-normal text-muted-foreground">{sub}</p>
    </div>
  )
}

/** Barra fixa com os botões do passo. */
function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-[430px] gap-2 px-5 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  )
}

function CodeStep(props: {
  appName: string
  coachFirst: string
  code: string
  setCode: (v: string) => void
  state: 'typing' | 'checking' | 'ok' | 'invalid'
  fullName?: string
  onNext: () => void
  fromLink: boolean
}) {
  const message = {
    typing: props.fromLink ? 'Abrimos pelo link, o código já veio preenchido' : 'São 6 letras e números, como K7M-2QX',
    checking: 'Conferindo o código…',
    ok: `Código válido · acesso de ${props.fullName}`,
    invalid: `Código não encontrado ou expirado. Peça um novo ao ${props.coachFirst}.`,
  }[props.state]
  return (
    <>
      <Title sub={`O ${props.coachFirst} criou seu acesso. Confira o código que veio na mensagem dele.`}>Boas-vindas à {props.appName}</Title>
      <div className="flex flex-col gap-2">
        <label htmlFor="pa-codigo" className="text-[13px] font-bold text-foreground-2">
          Código de acesso
        </label>
        <input
          id="pa-codigo"
          type="text"
          autoCapitalize="characters"
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={7}
          value={props.code}
          onChange={(e) => props.setCode(formatInviteCode(normalizeInviteCode(e.target.value)))}
          aria-invalid={props.state === 'invalid'}
          aria-describedby="pa-codigo-msg"
          className={cn(
            'h-16 rounded-[18px] border bg-card text-center font-mono text-[28px] font-extrabold tracking-[8px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            props.state === 'ok' ? 'border-primary' : props.state === 'invalid' ? 'border-destructive' : '',
          )}
        />
        <span
          id="pa-codigo-msg"
          role={props.state === 'invalid' ? 'alert' : undefined}
          className={cn('text-[12.5px]', props.state === 'ok' ? 'text-primary' : props.state === 'invalid' ? 'text-destructive' : 'text-muted-foreground')}
        >
          {message}
        </span>
      </div>
      <p className="text-center text-[13px] text-muted-foreground">
        Já tem senha?{' '}
        <Link to="/entrar" className="font-bold text-primary">
          Entrar
        </Link>
      </p>
      <Footer>
        <Button size="xl" disabled={props.state !== 'ok'} onClick={props.onNext} className={primary}>
          Continuar
        </Button>
      </Footer>
    </>
  )
}

function PasswordStep({ invite, onBack, onNext }: { invite: { code: string; fullName: string; phone: string; email: string; coachName: string }; onBack: () => void; onNext: () => void }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [terms, setTerms] = useState(false)
  const [health, setHealth] = useState(false)
  const accept = useAcceptInvite()
  const rules = passwordRules(password, { name: invite.fullName, phone: invite.phone })
  const mismatch = repeat !== '' && repeat !== password
  const ok = rules.every((r) => r.ok) && repeat === password && terms && health
  const coachFirst = invite.coachName.split(' ')[0]

  return (
    <>
      <Title sub="Você vai entrar com seu celular e esta senha.">Crie sua senha</Title>
      <div className="flex flex-col gap-0.5 rounded-2xl border bg-card px-3.5 py-3">
        <span className="text-[15px] font-extrabold">{invite.fullName}</span>
        <span className="text-[12.5px] text-muted-foreground">
          {invite.phone} · {invite.email}
        </span>
        <span className="text-xs text-muted-foreground">Algum dado errado? Avise o {coachFirst} depois pelo chat.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pa-senha" className="text-[13px] font-bold text-foreground-2">
          Senha
        </label>
        <PasswordInput id="pa-senha" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <PasswordRules rules={rules} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pa-repita" className="text-[13px] font-bold text-foreground-2">
          Repita a senha
        </label>
        <PasswordInput id="pa-repita" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} aria-invalid={mismatch} />
        {mismatch && <span className="text-[12.5px] text-destructive">As senhas não são iguais.</span>}
      </div>
      <Consent checked={terms} onChange={setTerms}>
        Li e aceito os Termos de uso e a Política de privacidade.
      </Consent>
      <Consent checked={health} onChange={setHealth}>
        Autorizo o {coachFirst} e a nutricionista da equipe a usar meus dados de saúde (peso, medidas, fotos e dores) só para montar meu treino e minha dieta.
        Posso revogar quando quiser.
      </Consent>
      {accept.error && <FormError>{(accept.error as AuthError).status === 404 ? 'Este convite já foi usado ou expirou.' : 'Não foi possível criar a senha. Tente de novo.'}</FormError>}
      <Footer>
        <button type="button" onClick={onBack} className={secondary}>
          Voltar
        </button>
        <Button
          size="xl"
          disabled={!ok || accept.isPending}
          onClick={() => accept.mutate({ code: invite.code, password, terms, health }, { onSuccess: onNext })}
          className={primary}
        >
          {accept.isPending ? 'Criando…' : 'Criar senha'}
        </Button>
      </Footer>
    </>
  )
}

function Consent({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-[14px] border p-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
        checked && 'border-primary',
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={cn('flex size-5.5 shrink-0 items-center justify-center rounded-[7px] border-2 text-primary-foreground', checked ? 'border-primary bg-primary' : 'border-line-strong')}
      >
        {checked && <Check className="size-3" strokeWidth={3.6} />}
      </span>
      <span className="text-[13px] leading-[1.45] text-foreground-2">{children}</span>
    </label>
  )
}

const goals: { value: Anamnesis['goal']; label: string }[] = [
  { value: 'lose', label: 'Emagrecer' },
  { value: 'gain', label: 'Ganhar massa' },
  { value: 'health', label: 'Saúde e disposição' },
  { value: 'performance', label: 'Performance' },
]
const levels: { value: Anamnesis['experience']; label: string }[] = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]
const painAreas: { value: Anamnesis['pains'][number]; label: string }[] = [
  { value: 'knee', label: 'Joelho' },
  { value: 'lowerBack', label: 'Lombar' },
  { value: 'shoulder', label: 'Ombro' },
  { value: 'hip', label: 'Quadril' },
  { value: 'other', label: 'Outra' },
]

const chip = (on: boolean) =>
  cn(
    'flex cursor-pointer items-center justify-center rounded-[14px] border text-[13.5px] font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
    on ? 'border-primary bg-primary/14 text-primary' : 'bg-card text-foreground-2',
  )

function AboutStep({ coachFirst, onNext }: { coachFirst: string; onNext: () => void }) {
  const [goal, setGoal] = useState<Anamnesis['goal'] | null>(null)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [experience, setExperience] = useState<Anamnesis['experience']>('beginner')
  const [days, setDays] = useState(3)
  const [pains, setPains] = useState<Anamnesis['pains'] | null>(null) // null = ainda não respondeu
  const [details, setDetails] = useState('')
  const save = useSaveAnamnesis()

  const weightKg = parseDecimal(weight)
  const heightCm = parseDecimal(height)
  const ok = !!goal && weightKg !== null && weightKg >= 25 && weightKg <= 400 && heightCm !== null && heightCm >= 100 && heightCm <= 250 && pains !== null

  const togglePain = (area: Anamnesis['pains'][number]) =>
    setPains((p) => {
      const list = p ?? []
      return list.includes(area) ? list.filter((a) => a !== area) : [...list, area]
    })

  const submit = () =>
    ok &&
    save.mutate(
      { goal: goal!, weightKg: weightKg!, heightCm: Math.round(heightCm!), experience, daysPerWeek: days, pains: pains!, painDetails: pains!.length ? details.trim() || null : null },
      { onSuccess: onNext },
    )

  return (
    <>
      <Title sub={`O ${coachFirst} usa estas respostas para montar seu primeiro treino.`}>Conte sobre você</Title>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold text-foreground-2">Seu objetivo principal</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {goals.map((g) => (
            <label key={g.value} className={cn(chip(goal === g.value), 'h-12')}>
              <input type="radio" name="objetivo" className="sr-only" checked={goal === g.value} onChange={() => setGoal(g.value)} />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="pa-peso" className="text-[13px] font-bold text-foreground-2">
            Peso (kg)
          </label>
          <input id="pa-peso" type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className={cn(field, 'h-12.5 rounded-[14px]')} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="pa-altura" className="text-[13px] font-bold text-foreground-2">
            Altura (cm)
          </label>
          <input id="pa-altura" type="text" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} className={cn(field, 'h-12.5 rounded-[14px]')} />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold text-foreground-2">Experiência com musculação</legend>
        <div className="grid grid-cols-3 gap-1 rounded-[14px] border bg-sunken p-1">
          {levels.map((l) => (
            <label
              key={l.value}
              className={cn(
                'flex h-10.5 cursor-pointer items-center justify-center rounded-[10px] text-[12.5px] font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                experience === l.value ? 'bg-primary text-primary-foreground' : '',
              )}
            >
              <input type="radio" name="experiencia" className="sr-only" checked={experience === l.value} onChange={() => setExperience(l.value)} />
              {l.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-2.5">
        <div className="flex grow flex-col gap-px">
          <span className="text-sm font-bold">Dias para treinar</span>
          <span className="text-xs text-muted-foreground">Por semana, de forma realista</span>
        </div>
        <Stepper value={days} onChange={setDays} label="dias por semana" min={1} max={7} format={(v) => `${v}x`} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold text-foreground-2">Sente dor ou tem alguma lesão?</legend>
        <div className="flex flex-wrap gap-1.5">
          <label className={cn(chip(pains?.length === 0), 'h-10 rounded-full px-3.5 text-[13px] font-bold')}>
            <input type="checkbox" className="sr-only" checked={pains?.length === 0} onChange={() => setPains(pains?.length === 0 ? null : [])} />
            Nenhuma
          </label>
          {painAreas.map((p) => (
            <label key={p.value} className={cn(chip(!!pains?.includes(p.value)), 'h-10 rounded-full px-3.5 text-[13px] font-bold')}>
              <input type="checkbox" className="sr-only" checked={!!pains?.includes(p.value)} onChange={() => togglePain(p.value)} />
              {p.label}
            </label>
          ))}
        </div>
        {!!pains?.length && (
          <Textarea
            rows={2}
            maxLength={500}
            aria-label="Detalhe a dor ou lesão"
            placeholder="Ex.: dói o joelho direito ao descer escada"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="rounded-[14px]"
          />
        )}
      </fieldset>
      {save.error && <FormError>Não foi possível enviar. Tente de novo.</FormError>}
      <Footer>
        <Button size="xl" disabled={!ok || save.isPending} onClick={submit} className={primary}>
          {save.isPending ? 'Enviando…' : 'Enviar respostas'}
        </Button>
      </Footer>
    </>
  )
}

function InstallStep({ appName, onNext }: { appName: string; onNext: () => void }) {
  const [os, setOs] = useState<'ios' | 'android'>(() => (isIos() ? 'ios' : 'android'))
  const prompt = useInstall((s) => s.prompt)
  const installed = useInstall((s) => s.installed)
  const iosSteps = [
    { text: 'Toque no botão Compartilhar do Safari, embaixo da tela', icon: Share },
    { text: 'Role e escolha "Adicionar à Tela de Início"', icon: Plus },
    { text: 'Toque em "Adicionar" e abra o app pelo ícone', icon: Check },
  ]
  return (
    <>
      <Title sub="Assim ele abre como um aplicativo e pode te avisar dos treinos.">Coloque o app na tela inicial</Title>
      <fieldset className="grid grid-cols-2 gap-1 rounded-[14px] border bg-sunken p-1">
        <legend className="sr-only">Seu celular</legend>
        {(
          [
            ['ios', 'iPhone'],
            ['android', 'Android'],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={cn(
              'flex h-10.5 cursor-pointer items-center justify-center rounded-[10px] text-[13px] font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              os === value ? 'bg-primary text-primary-foreground' : '',
            )}
          >
            <input type="radio" name="celular" className="sr-only" checked={os === value} onChange={() => setOs(value)} />
            {label}
          </label>
        ))}
      </fieldset>
      {os === 'ios' ? (
        <>
          <ol className="flex flex-col gap-2.5">
            {iosSteps.map((s, i) => (
              <li key={s.text} className="flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-3">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-extrabold">
                  {i + 1}
                </span>
                <span className="grow text-sm leading-[1.4]">{s.text}</span>
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-info">
                  <s.icon className="size-4.5" strokeWidth={2} />
                </span>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-[1.45] text-warning">No iPhone, os lembretes só chegam com o app instalado desta forma (iOS 16.4 ou mais novo).</p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border bg-card p-4 text-center">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-[18px] bg-primary text-[22px] font-extrabold text-primary-foreground">
            {initials(appName)}
          </span>
          <span className="text-sm text-foreground-2">{appName}</span>
          {prompt || installed ? (
            <Button size="xl" disabled={installed} onClick={() => void install()} className={cn(primary, 'w-full grow-0')}>
              {installed ? 'Instalado' : 'Instalar app'}
            </Button>
          ) : (
            <p className="text-[13px] leading-normal text-muted-foreground">No Chrome, toque no menu ⋮ e escolha "Instalar app" ou "Adicionar à tela inicial".</p>
          )}
        </div>
      )}
      <Footer>
        <button type="button" onClick={onNext} className={secondary}>
          Depois
        </button>
        <Button size="xl" onClick={onNext} className={primary}>
          {os === 'ios' ? 'Já adicionei' : 'Continuar'}
        </Button>
      </Footer>
    </>
  )
}

function RemindersStep({ coachFirst, onNext }: { coachFirst: string; onNext: () => void }) {
  const push = usePushNotifications()
  const [asked, setAsked] = useState(false)
  const perks = [
    { title: 'Dia de treino', desc: 'Nos dias de treino, às 18:00', icon: Dumbbell, tone: 'bg-primary/14 text-primary' },
    { title: `Resposta do ${coachFirst}`, desc: 'Quando ele responder seu check-in ou mensagem', icon: MessageCircle, tone: 'bg-info/16 text-info' },
    { title: 'Refeições', desc: 'Lembrete antes de cada refeição do plano', icon: Utensils, tone: 'bg-violet/16 text-violet' },
    { title: 'Check-in', desc: 'No dia de enviar fotos e medidas', icon: ClipboardCheck, tone: 'bg-warning/16 text-warning' },
  ]
  const on = push.state === 'on'
  const allow = async () => {
    await push.toggle()
    setAsked(true)
  }
  return (
    <>
      <Title sub="Você escolhe quais depois, no seu perfil.">Quer receber lembretes?</Title>
      <ul className="flex flex-col gap-2">
        {perks.map((p) => (
          <li key={p.title} className="flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-3">
            <span aria-hidden="true" className={cn('flex size-9.5 shrink-0 items-center justify-center rounded-xl', p.tone)}>
              <p.icon className="size-4.5" strokeWidth={2} />
            </span>
            <span className="flex flex-col gap-px">
              <span className="text-sm font-extrabold">{p.title}</span>
              <span className="text-xs text-muted-foreground">{p.desc}</span>
            </span>
          </li>
        ))}
      </ul>
      {(asked || push.state === 'denied' || push.state === 'unsupported' || push.state === 'needs-install') && (
        <p role="status" className={cn('rounded-[14px] border px-3.5 py-3 text-[13.5px] leading-[1.45]', on ? 'border-primary bg-primary/14' : 'bg-card')}>
          {on
            ? 'Lembretes ativados neste celular.'
            : push.state === 'needs-install'
              ? 'No iPhone, os lembretes chegam depois de instalar o app na tela inicial. Você pode ativar em Perfil › Notificações.'
              : 'Tudo bem. Você pode ativar depois em Perfil › Notificações.'}
        </p>
      )}
      <Footer>
        {!on && (
          <button type="button" onClick={onNext} className={secondary}>
            Agora não
          </button>
        )}
        {on || push.state !== 'off' ? (
          <Button size="xl" onClick={onNext} className={primary}>
            Continuar
          </Button>
        ) : (
          <Button size="xl" onClick={() => void allow()} className={primary}>
            Permitir lembretes
          </Button>
        )}
      </Footer>
    </>
  )
}

function Done({ firstName, coachFirst }: { firstName: string; coachFirst: string }) {
  return (
    <>
      <div className="mt-15 flex flex-col items-center gap-3.5 text-center">
        <span aria-hidden="true" className="flex size-21 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-9.5" strokeWidth={2.8} />
        </span>
        <h1 className="text-[26px] font-extrabold">Tudo pronto, {firstName}!</h1>
        <p className="max-w-75 text-[15px] leading-normal text-muted-foreground">
          O {coachFirst} já recebeu suas respostas. Seu primeiro treino aparece aqui em até 48 h, e você recebe um aviso.
        </p>
        <div className="flex w-full flex-col gap-1 rounded-2xl border bg-card px-3.5 py-3 text-left">
          <span className="text-xs font-extrabold text-muted-foreground">ENQUANTO ISSO</span>
          <span className="text-sm leading-normal">
            Mande um oi para o {coachFirst}{' '}
            <Link to="/chat" className="font-bold text-primary">
              no chat
            </Link>
            .
          </span>
        </div>
      </div>
      <Footer>
        <Link
          to="/"
          replace
          className="flex h-13.5 grow items-center justify-center rounded-full bg-primary text-[15px] font-extrabold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Ir para o app
        </Link>
      </Footer>
    </>
  )
}
