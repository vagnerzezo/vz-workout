import { toast } from 'sonner'
import {
  ageOn,
  checkInFrequencyLabel,
  CheckInFrequency,
  parseIsoDate,
  syncedLabel,
  type StudentAppSettings,
  type StudentDetail,
} from '@workspace/core'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { useUpdateSettings } from '../api/queries'
import { cardClass } from './card'

type Row = { label: string; value: string; highlight?: boolean; className?: string }

function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map((r, i) => (
        <div key={r.label} className={cn('flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4', i > 0 && 'border-t border-[#22252b]')}>
          <dt className="shrink-0 text-[13px] text-muted-foreground">{r.label}</dt>
          <dd className={cn('text-sm font-semibold sm:text-right', r.highlight && 'text-warning', r.className)}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const date = (iso: string) => parseIsoDate(iso).toLocaleDateString('pt-BR')

const switches: { key: Exclude<keyof StudentAppSettings, 'checkInFrequency'>; label: string; hint: string }[] = [
  { key: 'appAccess', label: 'Acesso ao app', hint: 'Desligado bloqueia o login do aluno' },
  { key: 'showDiet', label: 'Mostrar dieta no app', hint: 'Aba Dieta visível para o aluno' },
  { key: 'allowSwaps', label: 'Permitir substituições', hint: 'Aluno troca alimentos pelas opções da ficha' },
  { key: 'suggestLastLoad', label: 'Sugerir carga anterior', hint: 'Pré-preenche a última carga usada' },
  { key: 'askPhotos', label: 'Pedir fotos no check-in', hint: 'Frente, lado e costas' },
]

const payment = { ok: ['Em dia', 'text-primary'], late: ['Atrasado', 'text-destructive'], pending: ['Aguardando o primeiro pagamento', 'text-warning'] } as const

/** Informações: dados pessoais, anamnese, plano e as configurações que o treinador controla. */
export function InfoTab({ detail: d, now }: { detail: StudentDetail; now: Date }) {
  const update = useUpdateSettings(d.student.id)
  const save = (patch: Partial<StudentAppSettings>, done: string) =>
    update.mutate(patch, { onSuccess: () => toast.success(done), onError: () => toast.error('Não foi possível salvar. Tente de novo.') })

  const personal: Row[] = [
    ...(d.birthDate ? [{ label: 'Nascimento', value: `${date(d.birthDate)} (${ageOn(d.birthDate, now)} anos)` }] : []),
    ...(d.sex ? [{ label: 'Sexo', value: d.sex === 'male' ? 'Masculino' : 'Feminino' }] : []),
    ...(d.heightCm ? [{ label: 'Altura', value: `${d.heightCm} cm` }] : []),
    ...(d.phone ? [{ label: 'Telefone', value: d.phone }] : []),
    { label: 'E-mail', value: d.student.email },
    ...(d.city ? [{ label: 'Cidade', value: d.city }] : []),
    { label: 'Aluno desde', value: date(d.memberSince) },
  ]
  const [payLabel, payClass] = payment[d.subscription.payment]
  const plan: Row[] = [
    { label: 'Plano', value: d.subscription.planLabel },
    { label: 'Início', value: date(d.subscription.startedOn) },
    { label: 'Vencimento', value: date(d.subscription.endsOn) },
    { label: 'Pagamento', value: payLabel, className: payClass },
    { label: 'Último acesso ao app', value: d.lastSeenAt ? capitalize(syncedLabel(d.lastSeenAt, now)) : 'Ainda não acessou' },
  ]

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      <section aria-labelledby="dados-pessoais" className={cardClass}>
        <h2 id="dados-pessoais" className="text-base font-extrabold">
          Dados pessoais
        </h2>
        <Rows rows={personal} />
      </section>

      <section aria-labelledby="anamnese" className={cardClass}>
        <div className="flex items-baseline justify-between">
          <h2 id="anamnese" className="text-base font-extrabold">
            Anamnese
          </h2>
          {d.anamnesis && <span className="text-xs text-muted-foreground">respondida em {date(d.anamnesis.answeredOn).slice(0, 5)}</span>}
        </div>
        {d.anamnesis ? <Rows rows={d.anamnesis.fields} /> : <p className="text-sm text-muted-foreground">O aluno responde a anamnese no primeiro acesso ao app.</p>}
      </section>

      <section aria-labelledby="plano-acesso" className={cardClass}>
        <h2 id="plano-acesso" className="text-base font-extrabold">
          Plano e acesso
        </h2>
        <Rows rows={plan} />
      </section>

      <section aria-labelledby="config-aluno" className={cardClass}>
        <h2 id="config-aluno" className="text-base font-extrabold">
          Configurações do aluno
        </h2>
        <ul className="flex flex-col">
          {switches.map((sw, i) => {
            const on = d.settings[sw.key]
            return (
              <li key={sw.key} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-[#22252b]')}>
                <div className="flex grow flex-col gap-0.5">
                  <span id={`sw-${sw.key}`} className="text-sm font-bold">
                    {sw.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{sw.hint}</span>
                </div>
                <Switch aria-labelledby={`sw-${sw.key}`} checked={on} onCheckedChange={(v) => save({ [sw.key]: v }, `${sw.label}: ${v ? 'ligado' : 'desligado'}`)} />
              </li>
            )
          })}
        </ul>
        <label className="flex items-center justify-between gap-3 border-t border-[#22252b] pt-3 text-sm font-bold">
          Frequência do check-in
          <select
            value={d.settings.checkInFrequency}
            onChange={(e) => {
              const f = CheckInFrequency.parse(e.target.value)
              save({ checkInFrequency: f }, `Check-in ${checkInFrequencyLabel[f].toLowerCase()}`)
            }}
            className="h-10 rounded-full border border-input bg-secondary px-3.5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {CheckInFrequency.options.map((f) => (
              <option key={f} value={f}>
                {checkInFrequencyLabel[f]}
              </option>
            ))}
          </select>
        </label>
      </section>
    </div>
  )
}
