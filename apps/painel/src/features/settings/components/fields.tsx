import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Minus, Plus, X } from 'lucide-react'
import {
  areaLabel,
  CheckInQuestionType,
  isPermissionLocked,
  isValidCref,
  nextPermission,
  PermissionArea,
  permissionLabel,
  questionTypeLabel,
  restLabel,
  roleLabel,
  SPECIALTIES,
  TeamRole,
  Weekday,
  weekdayShortLabel,
  initials,
  type CheckInFrequency,
  type CoachSettings,
  type Permission,
} from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'

export const field = 'w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'
export const chip = (on: boolean) => cn('h-8.5 shrink-0 rounded-full border px-3 text-[12.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')
const label = 'text-xs font-bold text-foreground-2'

type S = CoachSettings
type Part<K extends keyof S> = { value: S[K]; onChange: (v: S[K]) => void }

export function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard?.writeText(`https://${link}`).catch(() => undefined)
    setCopied(true)
    toast.success('Link de convite copiado')
  }
  return (
    <div className="flex items-center gap-2 rounded-[14px] border bg-card py-1.5 pr-1.5 pl-3.5">
      <span className="min-w-0 grow truncate text-[13px] text-foreground-2">{link}</span>
      <Button size="sm" variant="outline" onClick={copy} className="shrink-0 font-bold">
        <Copy aria-hidden="true" />
        {copied ? 'Copiado' : 'Copiar link'}
      </Button>
    </div>
  )
}

export function ProfileFields({ value, onChange, desktop }: Part<'profile'> & { desktop: boolean }) {
  const id = useId()
  const crefOk = isValidCref(value.cref)
  const set = (p: Partial<S['profile']>) => onChange({ ...value, ...p })
  return (
    <div className="flex flex-col gap-4">
      <div className={cn('grid gap-4', desktop && 'grid-cols-2')}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-nome`} className={label}>
            Nome profissional
          </label>
          <input id={`${id}-nome`} value={value.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={value.name.trim().length < 3} className={cn(field, 'h-12')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-cref`} className={label}>
            Registro CREF
          </label>
          <input id={`${id}-cref`} value={value.cref} onChange={(e) => set({ cref: e.target.value.toUpperCase() })} placeholder="000000-G/UF" aria-invalid={!crefOk} aria-describedby={`${id}-cref-msg`} className={cn(field, 'h-12 uppercase')} />
          <span id={`${id}-cref-msg`} className={cn('text-[11.5px]', crefOk ? 'text-muted-foreground' : 'text-destructive')}>
            {crefOk ? 'Aparece no seu perfil para os alunos' : 'Formato: 6 números, G ou P e a UF (ex.: 012345-G/RS)'}
          </span>
        </div>
        {desktop && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-email`} className={label}>
                E-mail
              </label>
              <input id={`${id}-email`} type="email" value={value.email} onChange={(e) => set({ email: e.target.value })} className={cn(field, 'h-12')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-whats`} className={label}>
                WhatsApp
              </label>
              <input id={`${id}-whats`} type="tel" value={value.phone} onChange={(e) => set({ phone: e.target.value })} className={cn(field, 'h-12')} />
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between">
          <label htmlFor={`${id}-bio`} className={label}>
            Apresentação (aparece na tela de convite)
          </label>
          <span className="text-[11.5px] text-muted-foreground">{value.bio.length}/280</span>
        </span>
        <textarea id={`${id}-bio`} rows={4} maxLength={280} value={value.bio} onChange={(e) => set({ bio: e.target.value })} className={cn(field, 'resize-none py-3 leading-[1.45]')} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Especialidades</span>
        <div role="group" aria-label="Especialidades" className="flex flex-wrap gap-1.5">
          {SPECIALTIES.map((s) => {
            const on = value.specialties.includes(s)
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => set({ specialties: on ? value.specialties.filter((x) => x !== s) : [...value.specialties, s] })} className={chip(on)}>
                {s}
              </button>
            )
          })}
        </div>
      </div>
      {desktop && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Link de convite</span>
          <InviteLink link={value.inviteLink} />
        </div>
      )}
    </div>
  )
}

const roleTone: Record<TeamRole, string> = { owner: 'bg-primary/14 text-primary', nutritionist: 'bg-violet/16 text-violet', assistant: 'bg-info/16 text-info' }

export function TeamList({ team }: { team: S['team'] }) {
  return (
    <ul aria-label="Membros da equipe" className="flex flex-col">
      {team.map((m) => (
        <li key={m.id} className="flex items-center gap-3 border-b border-[#22252b] py-3 last:border-b-0">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-xs font-extrabold">
            {initials(m.name)}
          </span>
          <span className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-sm font-extrabold">{m.name}</span>
            <span className="truncate text-xs text-muted-foreground">{m.meta}</span>
          </span>
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold', roleTone[m.role])}>{roleLabel[m.role]}</span>
          {m.pending && <span className="sr-only">, convite pendente</span>}
        </li>
      ))}
    </ul>
  )
}

const permTone: Record<Permission, string> = { edit: 'border-primary bg-primary/12 text-primary', view: 'border-info/50 bg-info/14 text-info', none: 'border-input text-muted-foreground' }

/** Tabela de permissões: clicar alterna Editar → Ver → Sem acesso. */
export function PermissionsTable({ value, onChange }: Part<'permissions'>) {
  return (
    <div className="flex flex-col gap-3">
      <table aria-label="Permissões por função" className="w-full border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-[11px] font-extrabold tracking-wide text-muted-foreground">
            <th scope="col" className="font-extrabold">
              ÁREA
            </th>
            {TeamRole.options.map((r) => (
              <th key={r} scope="col" className="font-extrabold">
                {roleLabel[r].toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PermissionArea.options.map((a) => (
            <tr key={a}>
              <th scope="row" className="pr-3 text-left font-bold">
                {areaLabel[a]}
              </th>
              {TeamRole.options.map((r) => {
                const p = value[a][r]
                const locked = isPermissionLocked(r, a)
                const suffix = locked ? ' · fixo' : a === 'diets' && r !== 'nutritionist' ? ' · sem CRN' : ''
                return (
                  <td key={r} className="pr-2">
                    <button
                      type="button"
                      disabled={locked}
                      aria-label={`${areaLabel[a]}, ${roleLabel[r]}: ${permissionLabel[p]}`}
                      onClick={() => onChange({ ...value, [a]: { ...value[a], [r]: nextPermission(r, a, p) } })}
                      className={cn('h-8.5 w-full rounded-lg border px-2 text-xs font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default', permTone[p])}
                    >
                      {permissionLabel[p]}
                      {suffix}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs leading-normal text-muted-foreground">Fichas de dieta: edição só para quem tem CRN cadastrado. Prescrever dieta é atividade privativa de nutricionista (Lei 8.234/91), por isso Dono e Assistente só alternam entre Ver e Sem acesso.</p>
    </div>
  )
}

const frequencies: [CheckInFrequency, string][] = [
  ['weekly', 'Semanal'],
  ['biweekly', 'Quinzenal'],
  ['monthly', 'Mensal'],
]
export const frequencyLabel = Object.fromEntries(frequencies) as Record<CheckInFrequency, string>

const typeTone: Record<CheckInQuestionType, string> = { rating: 'bg-primary/14 text-primary', number: 'bg-info/14 text-info', yesNo: 'bg-violet/16 text-violet', text: 'bg-secondary text-foreground-2', photo: 'bg-warning/14 text-warning' }

export function CheckInFields({ value, onChange, desktop }: Part<'checkIn'> & { desktop: boolean }) {
  const id = useId()
  const [text, setText] = useState('')
  const [type, setType] = useState<CheckInQuestionType>('rating')
  const add = () => {
    if (!text.trim()) return
    onChange({ ...value, questions: [...value.questions, { id: `q_${Date.now()}`, text: text.trim(), type }] })
    setText('')
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className={label}>Frequência padrão</span>
        <div role="radiogroup" aria-label="Frequência padrão" className="flex gap-1 self-start rounded-full border p-1">
          {frequencies.map(([f, l]) => (
            <button key={f} type="button" role="radio" aria-checked={value.frequency === f} onClick={() => onChange({ ...value, frequency: f })} className={cn('h-8 rounded-full px-3.5 text-[13px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', value.frequency === f ? 'bg-primary text-primary-foreground' : 'text-foreground-2')}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-muted-foreground">Cada aluno pode ter uma frequência própria no perfil dele.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Perguntas ({value.questions.length})</span>
        <ol aria-label="Perguntas do check-in" className="flex flex-col">
          {value.questions.map((q, i) => (
            <li key={q.id} className="flex items-center gap-2.5 border-b border-[#22252b] py-2 last:border-b-0">
              <span aria-hidden="true" className="w-5 shrink-0 text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 grow text-sm">{q.text}</span>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', typeTone[q.type])}>{questionTypeLabel[q.type]}</span>
              {desktop && (
                <button type="button" aria-label={`Remover "${q.text}"`} disabled={value.questions.length === 1} onClick={() => onChange({ ...value, questions: value.questions.filter((x) => x.id !== q.id) })} className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40">
                  <X aria-hidden="true" className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>
      {desktop ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line-strong p-3">
          <label htmlFor={`${id}-nova`} className={label}>
            Nova pergunta
          </label>
          <div className="flex gap-2">
            <input id={`${id}-nova`} value={text} maxLength={120} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Ex.: Quantas horas dormiu por noite?" className={cn(field, 'h-11')} />
            <Button size="lg" onClick={add} disabled={!text.trim()} className="font-extrabold">
              Adicionar
            </Button>
          </div>
          <div role="radiogroup" aria-label="Tipo de resposta" className="flex flex-wrap gap-1.5">
            {CheckInQuestionType.options.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={chip(type === t)}>
                {questionTypeLabel[t]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Para criar ou reordenar perguntas, use o painel no computador.</p>
      )}
    </div>
  )
}

export function HoursFields({ value, onChange }: Part<'hours'>) {
  const id = useId()
  const setDay = (d: Weekday, p: Partial<S['hours']['days'][Weekday]>) => onChange({ ...value, days: { ...value.days, [d]: { ...value.days[d], ...p } } })
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Horário de atendimento" className="flex flex-col">
        {Weekday.options.map((d) => {
          const day = value.days[d]
          return (
            <li key={d} className="flex min-h-13 items-center gap-3 border-b border-[#22252b] py-1.5 last:border-b-0">
              <Switch checked={day.on} onCheckedChange={(on) => setDay(d, { on })} aria-label={`Atender ${weekdayShortLabel[d].toLowerCase()}`} />
              <span className="w-18 shrink-0 text-sm font-bold">{weekdayShortLabel[d]}</span>
              {day.on ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="time" aria-label={`${weekdayShortLabel[d]}, início`} value={day.from} onChange={(e) => setDay(d, { from: e.target.value })} className={cn(field, 'h-9 w-24 px-2 text-sm')} />
                  até
                  <input type="time" aria-label={`${weekdayShortLabel[d]}, fim`} value={day.to} onChange={(e) => setDay(d, { to: e.target.value })} className={cn(field, 'h-9 w-24 px-2 text-sm')} />
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Sem atendimento</span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-[11.5px] text-muted-foreground">Fora desse horário o chat responde automaticamente e os avisos ficam silenciosos.</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-prazo`} className={label}>
          Prazo de resposta mostrado no app
        </label>
        <input id={`${id}-prazo`} value={value.responseTime} maxLength={60} onChange={(e) => onChange({ ...value, responseTime: e.target.value })} className={cn(field, 'h-12')} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-auto`} className={label}>
          Resposta automática fora do horário
        </label>
        <textarea id={`${id}-auto`} rows={3} maxLength={200} value={value.autoReplyText} onChange={(e) => onChange({ ...value, autoReplyText: e.target.value })} className={cn(field, 'resize-none py-3 leading-[1.45]')} />
      </div>
    </div>
  )
}

export function DefaultsFields({ value, onChange }: Part<'defaults'>) {
  const step = (d: number) => onChange({ ...value, restSeconds: Math.min(600, Math.max(15, value.restSeconds + d)) })
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-bold">Descanso padrão</span>
        <span className="text-[11.5px] text-muted-foreground">Entre séries válidas, em fichas novas</span>
      </span>
      <span className="flex items-center gap-2">
        <Button size="icon" variant="outline" aria-label="Menos 15 segundos" disabled={value.restSeconds <= 15} onClick={() => step(-15)} className="rounded-full">
          <Minus aria-hidden="true" />
        </Button>
        <output aria-label="Descanso padrão" className="w-18 text-center text-[15px] font-extrabold">
          {restLabel(value.restSeconds)}
        </output>
        <Button size="icon" variant="outline" aria-label="Mais 15 segundos" disabled={value.restSeconds >= 600} onClick={() => step(15)} className="rounded-full">
          <Plus aria-hidden="true" />
        </Button>
      </span>
    </div>
  )
}

/** Ainda sem tela: avisa e segue (LGPD, plano, termo, exclusão). */
export const soon = (what: string) => toast(`${what} chega em breve`)

export const settingsInvalid = (s: S) => !isValidCref(s.profile.cref) || s.profile.name.trim().length < 3 || !s.branding.appName.trim() || !s.checkIn.questions.length
