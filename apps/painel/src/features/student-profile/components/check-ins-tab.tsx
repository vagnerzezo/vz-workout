import { Link, useSearchParams } from 'react-router'
import { User } from 'lucide-react'
import { parseIsoDate, ratingTone, shortDate, type PhotoPose, type StudentCheckIn } from '@workspace/core'
import { buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { useStudentCheckIns } from '../api/queries'
import { cardClass } from './card'

const poseLabel: Record<PhotoPose, string> = { front: 'frente', side: 'lado', back: 'costas' }
const ratingClass = { good: 'text-primary', warning: 'text-warning', bad: 'text-destructive' } as const
const date = (iso: string) => shortDate(parseIsoDate(iso))

function CheckInDetail({ checkIn: c }: { checkIn: StudentCheckIn }) {
  const waiting = c.status === 'waiting'
  return (
    <section aria-labelledby="checkin-aberto" className={cardClass}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="checkin-aberto" className="text-base font-extrabold">
          Check-in de {date(c.date)}
        </h2>
        <span className={cn('text-xs', waiting ? 'font-bold text-warning' : 'text-muted-foreground')}>
          {waiting ? 'aguardando sua resposta' : c.answeredOn && `respondido por você em ${date(c.answeredOn)}`}
        </span>
      </div>

      {/* Fotos: sem arquivo na API simulada, a silhueta ocupa o lugar */}
      <div className="grid grid-cols-3 gap-2">
        {c.poses.map((p) => (
          <div key={p} className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl bg-sunken text-xs text-muted-foreground">
            <User aria-hidden="true" className="size-8" strokeWidth={1.4} />
            Foto · {poseLabel[p]}
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {c.ratings.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5 rounded-xl bg-secondary px-3 py-2">
            <dt className="text-[11.5px] text-muted-foreground">{r.label}</dt>
            <dd className={cn('text-base font-extrabold', ratingClass[ratingTone(r.value)])}>{r.value}/5</dd>
          </div>
        ))}
      </dl>

      {c.pain && (
        <p className="rounded-xl border border-warning/40 bg-warning/8 px-3.5 py-2.5 text-[13px] leading-[1.45]">
          <strong className="mb-0.5 block text-[11px] tracking-[0.8px] text-warning">DOR RELATADA</strong>
          {c.pain}
        </p>
      )}
      {c.comment && (
        <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-[13px] leading-[1.45]">
          <strong className="mb-0.5 block text-[11px] tracking-[0.8px] text-muted-foreground">COMENTÁRIO DO ALUNO</strong>
          {c.comment}
        </p>
      )}

      {waiting ? (
        <Link to={`/check-ins/revisar/${c.id}`} className={cn(buttonVariants({ size: 'lg', className: 'self-start' }))}>
          Responder check-in
        </Link>
      ) : (
        c.reply && (
          <p className="text-[13px] leading-[1.45] text-foreground-2">
            <strong className="mb-0.5 block text-[11px] tracking-[0.8px] text-muted-foreground">SUA RESPOSTA</strong>
            {c.reply}
          </p>
        )
      )}
    </section>
  )
}

/** Check-ins do aluno: lista à esquerda (em cima no celular) e o escolhido aberto (`?checkin=`). */
export function CheckInsTab({ studentId }: { studentId: string }) {
  const { data: checkIns, isError } = useStudentCheckIns(studentId)
  const [params] = useSearchParams()
  if (isError) return <p className="text-sm text-destructive">Não foi possível carregar os check-ins.</p>
  if (!checkIns) return <Skeleton aria-label="Carregando os check-ins" className="h-64 rounded-[20px]" />
  if (checkIns.length === 0) return <p className="rounded-[18px] border border-dashed border-line-strong p-5.5 text-center text-sm text-muted-foreground">Nenhum check-in ainda.</p>

  const open = checkIns.find((c) => c.id === params.get('checkin')) ?? checkIns[0]!
  const hrefOf = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('checkin', id)
    return `?${next}`
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(260px,1fr)_2fr] lg:items-start lg:gap-5">
      <section aria-labelledby="checkins-lista" className={cardClass}>
        <h2 id="checkins-lista" className="text-base font-extrabold">
          Check-ins
        </h2>
        <ul className="flex flex-col gap-2">
          {checkIns.map((c) => {
            const on = c.id === open.id
            const waiting = c.status === 'waiting'
            return (
              <li key={c.id}>
                <Link
                  to={hrefOf(c.id)}
                  replace
                  preventScrollReset
                  aria-current={on ? 'true' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    on ? 'border-primary bg-primary/12' : waiting ? 'border-warning bg-[#1a1c21]' : 'bg-[#1a1c21]',
                  )}
                >
                  <span className="flex grow flex-col gap-0.5">
                    <span className="text-sm font-extrabold">
                      {date(c.date)} · {c.kind}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.summary}</span>
                  </span>
                  <span className={cn('flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-extrabold', waiting ? 'bg-warning/16 text-warning' : 'bg-primary/14 text-primary')}>
                    {waiting ? 'Aguardando' : 'Respondido'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
      <CheckInDetail checkIn={open} />
    </div>
  )
}
