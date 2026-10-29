import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { User } from 'lucide-react'
import { average, checkInAlerts, formatDecimal, parseIsoDate, ratingTone, replyTemplates, shortDate, type CheckInReview, type PhotoPose } from '@workspace/core'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

const poseLabel: Record<PhotoPose, string> = { front: 'Frente', side: 'Lado', back: 'Costas' }
const toneText = { danger: 'text-destructive', warning: 'text-warning', info: 'text-info' } as const
const toneChip = { danger: 'bg-destructive/16 text-destructive', warning: 'bg-warning/16 text-warning', info: 'bg-info/16 text-info' } as const
const dotTone = { good: 'bg-primary', warning: 'bg-warning', bad: 'bg-destructive' } as const
const one = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
const signed = (n: number) => (Math.abs(n) < 0.05 ? '±0' : `${n > 0 ? '+' : '−'}${one(Math.abs(n))}`)

export const firstName = (c: Pick<CheckInReview, 'studentName'>) => c.studentName.split(' ')[0]!

/** Chip do primeiro alerta (lista) ou nada. */
export function AlertChip({ checkIn }: { checkIn: CheckInReview }) {
  const first = checkInAlerts(checkIn)[0]
  return first ? <span className={cn('flex h-5.5 items-center self-start rounded-full px-2 text-[11px] font-extrabold', toneChip[first.tone])}>{first.text}</span> : null
}

/** Média das respostas nos últimos check-ins (a linha do canvas). */
function Trend({ values }: { values: number[] }) {
  const w = 300
  const step = values.length > 1 ? w / (values.length - 1) : 0
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(44 - ((v - 1) / 4) * 40).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`-4 0 ${w + 8} 48`} preserveAspectRatio="none" className="h-12 w-full" role="img" aria-label={`Média das respostas nos últimos ${values.length} check-ins: ${values.map(one).join(', ')}`}>
      <polyline points={points} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

type ReviewProps = {
  checkIn: CheckInReview
  /** O texto da resposta fica com quem chama (o celular envia pela barra de baixo) */
  reply: string
  onReply: (text: string) => void
  /** Botões ao fim da caixa de resposta (desktop) */
  replyActions?: ReactNode
}

/** O check-in inteiro: alertas, medidas, fotos, respostas, comentário e a resposta do treinador. */
export function CheckInReviewBody({ checkIn: c, reply, onReply, replyActions }: ReviewProps) {
  const [pose, setPose] = useState<PhotoPose>(c.poses[0] ?? 'front')
  const alerts = checkInAlerts(c)
  const avg = average(c.ratings.map((r) => r.value))
  const prevAvg = c.ratings.every((r) => r.previous !== null) ? average(c.ratings.map((r) => r.previous!)) : null
  const previous = c.previousOn ? shortDate(parseIsoDate(c.previousOn)) : null
  const metrics = [
    { k: 'Peso', now: `${formatDecimal(c.weight.now)} kg`, prev: c.weight.previous && `${formatDecimal(c.weight.previous)} kg`, d: c.weight.previous === null ? null : c.weight.now - c.weight.previous, unit: ' kg', lowerIsBetter: true },
    ...(c.waist ? [{ k: 'Cintura', now: `${c.waist.now} cm`, prev: c.waist.previous && `${c.waist.previous} cm`, d: c.waist.previous === null ? null : c.waist.now - c.waist.previous, unit: ' cm', lowerIsBetter: true }] : []),
    { k: 'Média das respostas', now: `${one(avg)}/5`, prev: prevAvg === null ? null : `${one(prevAvg)}/5`, d: prevAvg === null ? null : avg - prevAvg, unit: '', lowerIsBetter: false },
  ]
  const templates = replyTemplates(firstName(c))

  return (
    <div className="flex flex-col gap-4">
      {alerts.length > 0 && (
        <div role="note" aria-label="Pontos de atenção" className="flex flex-col gap-1.5 rounded-2xl border border-warning/40 bg-warning/8 px-3.5 py-3">
          <span className="text-[11px] font-extrabold tracking-[0.8px] text-warning">PONTOS DE ATENÇÃO</span>
          {alerts.map((a) => (
            <span key={a.text} className={cn('text-[13px] font-bold', toneText[a.tone])}>
              {a.text}
            </span>
          ))}
        </div>
      )}

      <dl aria-label="Medidas" className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.k} className="flex flex-col gap-0.5 rounded-2xl border bg-card px-3 py-2.5">
            <dt className="text-[11px] text-muted-foreground">{m.k}</dt>
            <dd className="text-base font-extrabold lg:text-lg">{m.now}</dd>
            {m.d !== null && (
              <dd className="text-[11px] text-muted-foreground">
                <span className="hidden lg:inline">antes {m.prev} · </span>
                <strong className={m.d === 0 ? 'text-muted-foreground' : m.d < 0 === m.lowerIsBetter ? 'text-primary' : 'text-warning'}>
                  {signed(m.d)}
                  {m.unit}
                </strong>
              </dd>
            )}
          </div>
        ))}
      </dl>

      <section aria-labelledby={`fotos-${c.id}`} className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 id={`fotos-${c.id}`} className="text-[15px] font-extrabold">
            Fotos
          </h2>
          <div role="tablist" aria-label="Ângulo da foto" className="flex gap-1 rounded-full border p-1">
            {c.poses.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={p === pose}
                onClick={() => setPose(p)}
                className={cn('h-8 rounded-full px-3 text-xs font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', p === pose ? 'bg-primary text-primary-foreground' : 'text-foreground-2')}
              >
                {poseLabel[p]}
              </button>
            ))}
          </div>
        </div>
        {/* Sem arquivo na API simulada: a silhueta ocupa o lugar da foto */}
        <div className="grid grid-cols-2 gap-2 lg:max-w-md">
          {[
            [`Antes · ${previous ?? 'sem foto'}${c.weight.previous ? ` · ${formatDecimal(c.weight.previous)} kg` : ''}`, 'antes'],
            [`Agora · ${formatDecimal(c.weight.now)} kg`, 'agora'],
          ].map(([caption, k]) => (
            <figure key={k} className="flex flex-col gap-1.5">
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-sunken text-muted-foreground">
                <User aria-hidden="true" className="size-12" strokeWidth={1.2} />
              </div>
              <figcaption className="text-center text-xs text-muted-foreground">
                {caption} · {poseLabel[pose].toLowerCase()}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby={`respostas-${c.id}`} className="flex flex-col gap-2.5 rounded-[20px] border bg-card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id={`respostas-${c.id}`} className="text-[15px] font-extrabold">
            Respostas
          </h2>
          {previous && <span className="text-xs text-muted-foreground">comparado com {previous}</span>}
        </div>
        <ul className="flex flex-col gap-2">
          {c.ratings.map((r) => {
            const d = r.previous === null ? null : r.value - r.previous
            return (
              <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto_52px] items-center gap-3 text-[13px]">
                <span className="text-foreground-2">{r.label}</span>
                <span role="img" aria-label={`${r.label}: ${r.value} de 5${r.previous !== null ? `, antes ${r.previous}` : ''}`} className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <span key={v} className={cn('size-2.5 rounded-full', v <= r.value ? dotTone[ratingTone(r.value)] : 'bg-secondary')} />
                  ))}
                </span>
                <span className={cn('text-right text-xs font-extrabold', d === null || d === 0 ? 'text-muted-foreground' : d > 0 ? 'text-primary' : 'text-destructive')}>
                  {r.value} · {d === null || d === 0 ? '=' : `${d > 0 ? '↑' : '↓'}${Math.abs(d)}`}
                </span>
              </li>
            )
          })}
        </ul>
        {c.history.length > 1 && (
          <div className="flex flex-col gap-1 border-t border-[#22252b] pt-2.5">
            <span className="flex items-baseline justify-between text-xs text-muted-foreground">
              Média · {c.history.length} check-ins <strong className="text-sm text-foreground">{one(avg)}/5</strong>
            </span>
            <Trend values={c.history} />
          </div>
        )}
      </section>

      {c.comment && (
        <p className="rounded-2xl bg-secondary px-3.5 py-3 text-[13.5px] leading-[1.5]">
          <strong className="mb-1 block text-[11px] tracking-[0.8px] text-muted-foreground">COMENTÁRIO DO ALUNO</strong>
          {c.comment}
        </p>
      )}

      {c.reply ? (
        <p className="rounded-2xl border border-primary/40 bg-primary/8 px-3.5 py-3 text-[13.5px] leading-[1.5]">
          <strong className="mb-1 block text-[11px] tracking-[0.8px] text-primary">SUA RESPOSTA · {shortDate(new Date(c.reply.at))}</strong>
          {c.reply.text}
          <span className={cn('mt-1.5 block text-[11.5px] font-bold', c.reply.read ? 'text-primary' : 'text-muted-foreground')}>{c.reply.read ? 'Lido pelo aluno' : 'Ainda não lido'}</span>
        </p>
      ) : (
        <section aria-labelledby={`resposta-${c.id}`} className="flex flex-col gap-2.5 rounded-[20px] border bg-card p-4">
          <h2 id={`resposta-${c.id}`} className="text-[15px] font-extrabold">
            Sua resposta
          </h2>
          <div role="group" aria-label="Respostas prontas" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {templates.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => onReply(t.text)}
                className={cn('h-8.5 shrink-0 rounded-full border px-3 text-xs font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', reply === t.text ? 'border-primary text-primary' : 'border-input text-foreground-2')}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            aria-label="Resposta ao aluno"
            rows={4}
            value={reply}
            onChange={(e) => onReply(e.target.value)}
            placeholder="Escreva o feedback que o aluno vai ver no app"
            className="rounded-xl border bg-background p-3 text-[13.5px] leading-normal outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/alunos/${c.studentId}?aba=treino`} className={cn(buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 font-bold' }))}>
              Ajustar treino
            </Link>
            <Link to={`/alunos/${c.studentId}?aba=dieta`} className={cn(buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 font-bold' }))}>
              Ajustar dieta
            </Link>
            {replyActions}
          </div>
        </section>
      )}
    </div>
  )
}
