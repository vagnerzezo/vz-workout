import { useEffect, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import {
  formatBRL,
  formatPhone,
  NewStudent,
  parseIsoDate,
  phoneDigits,
  planPriceLabel,
  subscriptionEnd,
  toIsoDate,
  type CreatedStudent,
  type InviteChannel,
  type NewStudentOptions,
} from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { ApiError } from '../../../shared/api/client'
import { useCreateStudent, usePhoneOwner } from '../api/queries'

const field =
  'h-12 w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'
const sectionTitle = 'text-[13px] font-extrabold tracking-[1px] text-muted-foreground'
const fieldLabel = 'text-xs font-bold text-foreground-2'

/** dd/mm/aaaa (o "Vence em" do canvas mostra o ano). */
export const fullDate = (iso: string) => parseIsoDate(iso).toLocaleDateString('pt-BR')

function Hint({ id, tone, children }: { id: string; tone: 'muted' | 'error' | 'warning'; children: ReactNode }) {
  const color = { muted: 'text-muted-foreground', error: 'text-destructive', warning: 'text-warning' }[tone]
  return (
    <span id={id} className={cn('text-[11.5px] leading-[1.4]', color)}>
      {children}
    </span>
  )
}

/** Botões de escolha única (role="radio"), no formato de chip. */
function Chips<V extends string | null>({ label, value, onChange, options }: { label: string; value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={fieldLabel}>{label}</span>
      <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {options.map((o) => {
          const on = o.value === value
          return (
            <button
              key={o.value ?? 'nenhum'}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn(
                'h-9.5 shrink-0 rounded-full border px-3 text-[12.5px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type NewStudentFormProps = {
  options: NewStudentOptions
  onCreated: (created: CreatedStudent, form: NewStudent) => void
  /** O sheet rola o corpo e deixa o botão fixo embaixo; a página deixa tudo no fluxo. */
  bodyClassName?: string
  footerClassName?: string
}

export function NewStudentForm({ options, onCreated, bodyClassName, footerClassName }: NewStudentFormProps) {
  const create = useCreateStudent()
  const { register, control, handleSubmit, setValue, setError, formState } = useForm<NewStudent>({
    resolver: zodResolver(NewStudent),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      mode: 'online',
      planId: options.plans[0]?.id ?? '',
      startsOn: toIsoDate(new Date()),
      paid: false,
      workoutTemplateId: null,
      dietOptionId: options.dietOptions[0]?.id ?? '',
      channel: 'whatsapp',
    },
  })
  const { errors } = formState
  const [phone, email, planId, startsOn, paid, channel] = useWatch({ control, name: ['phone', 'email', 'planId', 'startsOn', 'paid', 'channel'] })
  const owner = usePhoneOwner(phone).data ?? null
  const plan = options.plans.find((p) => p.id === planId)
  const dueOn = plan && startsOn ? subscriptionEnd(startsOn, plan.months) : null
  const emailUsable = NewStudent.shape.email.safeParse(email).success && email !== ''

  // Sem e-mail válido não dá para enviar por e-mail
  useEffect(() => {
    if (channel === 'email' && !emailUsable) setValue('channel', 'whatsapp')
  }, [channel, emailUsable, setValue])

  const submit = handleSubmit((form) => {
    if (owner) return
    create.mutate(form, {
      onSuccess: (created) => onCreated(created, form),
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) setError('phone', { message: 'Este número já está cadastrado.' })
        else setError('root', { message: 'Não foi possível criar o aluno. Tente de novo.' })
      },
    })
  })

  const channels: { value: InviteChannel; label: string; desc: string; disabled: boolean }[] = [
    { value: 'whatsapp', label: 'WhatsApp', desc: 'Mensagem pronta com link e código', disabled: false },
    { value: 'email', label: 'E-mail', desc: emailUsable ? `Para ${email.trim()}` : 'Preencha o e-mail para usar', disabled: !emailUsable },
    { value: 'qr', label: 'Mostrar QR Code agora', desc: 'Para quem está na sua frente, na academia', disabled: false },
  ]

  return (
    <form noValidate onSubmit={submit} aria-label="Novo aluno" className="flex min-h-0 grow flex-col">
      <div className={cn('flex flex-col gap-6', bodyClassName)}>
        <section aria-labelledby="novo-dados" className="flex flex-col gap-2.5">
          <h2 id="novo-dados" className={sectionTitle}>
            1 · DADOS
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="novo-nome" className={fieldLabel}>
              Nome completo
            </label>
            <input {...register('fullName')} id="novo-nome" autoComplete="off" aria-invalid={!!errors.fullName} aria-describedby="novo-nome-ajuda" className={field} />
            <Hint id="novo-nome-ajuda" tone={errors.fullName ? 'error' : 'muted'}>
              {errors.fullName?.message ?? 'Aparece assim no app, nos PDFs e nas cobranças'}
            </Hint>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="novo-whats" className={fieldLabel}>
              WhatsApp
            </label>
            <input
              {...register('phone', { onBlur: (e) => setValue('phone', formatPhone(e.target.value)) })}
              id="novo-whats"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="(51) 99999-9999"
              aria-invalid={!!errors.phone || !!owner}
              aria-describedby="novo-whats-ajuda"
              className={cn(field, owner && 'border-warning')}
            />
            {owner ? (
              <Hint id="novo-whats-ajuda" tone="warning">
                Este número já é de {owner.fullName}.{' '}
                <Link to={`/alunos/${owner.id}`} className="font-bold underline underline-offset-2">
                  Abra o perfil
                </Link>{' '}
                em vez de criar outro.
              </Hint>
            ) : (
              <Hint id="novo-whats-ajuda" tone={errors.phone ? 'error' : 'muted'}>
                {errors.phone?.message ?? (phoneDigits(phone).length === 11 ? `Será o login do aluno · ${formatPhone(phone)}` : 'DDD + 9 dígitos · será o login do aluno')}
              </Hint>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="novo-email" className={fieldLabel}>
              E-mail <span className="font-semibold text-muted-foreground">· opcional, usado para recuperar a senha</span>
            </label>
            <input {...register('email')} id="novo-email" type="email" inputMode="email" autoComplete="off" placeholder="aluno@email.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'novo-email-erro' : undefined} className={field} />
            {errors.email && (
              <Hint id="novo-email-erro" tone="error">
                {errors.email.message}
              </Hint>
            )}
          </div>
          <Controller
            control={control}
            name="mode"
            render={({ field: f }) => (
              <div role="radiogroup" aria-label="Modalidade" className="grid grid-cols-2 gap-1 rounded-[14px] border bg-background p-1">
                {(['online', 'presencial'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={f.value === m}
                    onClick={() => {
                      f.onChange(m)
                      if (m === 'presencial') setValue('channel', 'qr') // está na academia: QR na hora
                    }}
                    className={cn('h-10 rounded-[10px] text-[13px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', f.value === m ? 'bg-primary text-primary-foreground' : 'text-foreground')}
                  >
                    {m === 'online' ? 'Online' : 'Presencial'}
                  </button>
                ))}
              </div>
            )}
          />
        </section>

        <section aria-labelledby="novo-plano" className="flex flex-col gap-2.5">
          <h2 id="novo-plano" className={sectionTitle}>
            2 · PLANO
          </h2>
          <Controller
            control={control}
            name="planId"
            render={({ field: f }) => (
              <div role="radiogroup" aria-label="Plano" className="grid grid-cols-2 gap-1.5">
                {options.plans.map((p) => {
                  const on = f.value === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => f.onChange(p.id)}
                      className={cn(
                        'flex min-h-15 flex-col items-start justify-center gap-0.5 rounded-[14px] border px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        on ? 'border-primary bg-primary/14' : 'bg-card',
                      )}
                    >
                      <span className={cn('text-[13.5px] font-extrabold', on && 'text-primary')}>{p.name}</span>
                      <span className="text-xs text-muted-foreground">{planPriceLabel(p.price, p.months)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={fieldLabel}>Começa em</span>
              <input {...register('startsOn')} type="date" aria-invalid={!!errors.startsOn} className={cn(field, 'min-w-0 px-2.5 text-sm [color-scheme:dark]')} />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Vence em</span>
              <output className="flex h-12 items-center rounded-[14px] bg-secondary px-3 text-sm font-extrabold">{dueOn ? fullDate(dueOn) : '—'}</output>
            </div>
          </div>
          {errors.startsOn && (
            <Hint id="novo-inicio-erro" tone="error">
              {errors.startsOn.message}
            </Hint>
          )}
          <Controller
            control={control}
            name="paid"
            render={({ field: f }) => (
              <label className="flex min-h-14 items-center gap-3 rounded-[14px] border px-3 py-2">
                <span className="flex grow flex-col gap-px">
                  <span className="text-[13.5px] font-bold">Primeiro pagamento já recebido</span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {paid ? `Plano ativo até ${dueOn ? fullDate(dueOn) : '—'}, sem cobrança agora` : `A cobrança de ${plan ? formatBRL(plan.price) : '—'} vai junto com o acesso`}
                  </span>
                </span>
                <Switch checked={f.value} onCheckedChange={f.onChange} />
              </label>
            )}
          />
        </section>

        <section aria-labelledby="novo-conteudo" className="flex flex-col gap-2.5">
          <h2 id="novo-conteudo" className={sectionTitle}>
            3 · CONTEÚDO INICIAL
          </h2>
          <Controller
            control={control}
            name="workoutTemplateId"
            render={({ field: f }) => (
              <Chips label="Ficha de treino" value={f.value} onChange={f.onChange} options={[{ value: null, label: 'Montar depois da anamnese' }, ...options.workoutTemplates.map((t) => ({ value: t.id, label: t.label }))]} />
            )}
          />
          <Controller
            control={control}
            name="dietOptionId"
            render={({ field: f }) => <Chips label="Dieta" value={f.value} onChange={f.onChange} options={options.dietOptions.map((d) => ({ value: d.id, label: d.label }))} />}
          />
          <p className="text-[11.5px] leading-[1.45] text-muted-foreground">A anamnese que o aluno preenche no primeiro acesso chega para você antes de liberar a ficha.</p>
        </section>

        <section aria-labelledby="novo-envio" className="flex flex-col gap-2.5">
          <h2 id="novo-envio" className={sectionTitle}>
            4 · COMO ENVIAR O ACESSO
          </h2>
          <Controller
            control={control}
            name="channel"
            render={({ field: f }) => (
              <div role="radiogroup" aria-label="Como enviar o acesso" className="flex flex-col gap-1.5">
                {channels.map((c) => {
                  const on = f.value === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={c.disabled}
                      onClick={() => f.onChange(c.value)}
                      className={cn(
                        'flex min-h-14.5 items-center gap-3 rounded-[14px] border px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
                        on ? 'border-primary bg-primary/14' : 'bg-card',
                      )}
                    >
                      <span aria-hidden="true" className={cn('flex size-4.5 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-primary' : 'border-muted-foreground')}>
                        {on && <span className="size-2 rounded-full bg-primary" />}
                      </span>
                      <span className="flex flex-col gap-px">
                        <span className="text-sm font-extrabold">{c.label}</span>
                        <span className="text-[11.5px] text-muted-foreground">{c.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          />
        </section>

        {errors.root && (
          <p role="alert" className="rounded-xl border border-destructive/45 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
            {errors.root.message}
          </p>
        )}
      </div>

      <div className={footerClassName}>
        <Button type="submit" size="lg" disabled={create.isPending || !!owner} className="h-13 w-full text-[15px] font-extrabold">
          {create.isPending ? 'Criando…' : 'Criar aluno e gerar acesso'}
        </Button>
      </div>
    </form>
  )
}
