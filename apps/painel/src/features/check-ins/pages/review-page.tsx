import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { initials, reviewOrder, timeAgo } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useCheckIns, useReplyCheckIn } from '../api/queries'
import { CheckInReviewBody, firstName } from '../components/check-in-review'
import { CheckInsPage } from './check-ins-page'

/**
 * /check-ins/revisar/:id. No celular, a revisão em sequência (dor e alertas primeiro); no desktop,
 * a própria fila com este check-in aberto ao lado.
 */
export default function ReviewRoute() {
  const { id = '' } = useParams()
  return useIsDesktop() ? <CheckInsPage selectedId={id} /> : <SequentialReview id={id} />
}

function SequentialReview({ id }: { id: string }) {
  const navigate = useNavigate()
  const query = useCheckIns()
  const send = useReplyCheckIn()
  const [reply, setReply] = useState('')
  // A ordem da sessão fica fixa: quem já foi respondido continua na barra de progresso
  const [order, setOrder] = useState<string[] | null>(null)
  const [answered, setAnswered] = useState<string[]>([])

  const shell = (children: React.ReactNode) => <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">{children}</main>
  if (query.isError) return shell(<ErrorState title="Não foi possível carregar o check-in" retrying={query.isFetching} onRetry={() => query.refetch()} />)
  if (!query.data) return shell(<Skeleton aria-label="Carregando o check-in" className="h-[70vh] rounded-[20px]" />)

  const data = query.data
  const queue = order ?? reviewOrder(data.waiting).map((c) => c.id)
  if (!order && queue.length) setOrder(queue)
  const all = [...data.waiting, ...data.answered]
  const c = all.find((x) => x.id === id)
  const inQueue = queue.includes(id)
  const done = queue.length > 0 && queue.every((q) => answered.includes(q))

  const go = (target: string) => {
    setReply('')
    navigate(`/check-ins/revisar/${target}`, { replace: true })
  }
  const nextOpen = (from: string, skip: string[] = answered) => {
    const i = queue.indexOf(from)
    for (let k = 1; k <= queue.length; k++) {
      const j = queue[(i + k) % queue.length]!
      if (!skip.includes(j)) return j
    }
    return null
  }

  const header = (
    <header className="flex items-center gap-2.5">
      <Link to="/check-ins" aria-label="Voltar para check-ins" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Link>
      {c && (
        <>
          <div className="flex min-w-0 grow flex-col">
            <h1 className="truncate text-lg font-extrabold">{c.studentName}</h1>
            <span className="text-xs text-muted-foreground">
              <span className="capitalize">{c.kind}</span> · enviado {timeAgo(c.sentAt, new Date())}
            </span>
          </div>
          <Link to={`/alunos/${c.studentId}`} aria-label={`Abrir perfil de ${c.studentName}`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-[13px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {initials(c.studentName)}
          </Link>
        </>
      )}
    </header>
  )

  if (done) {
    return shell(
      <>
        {header}
        <section aria-label="Fila concluída" className="flex flex-col items-center gap-2.5 rounded-[22px] border bg-card px-4 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" strokeWidth={2.8} className="size-6.5" />
          </span>
          <h2 className="text-[19px] font-extrabold">Tudo respondido</h2>
          <p className="text-[13px] text-muted-foreground">{queue.length === 1 ? '1 aluno recebeu' : `${queue.length} alunos receberam`} seu feedback no app.</p>
          <Link to="/check-ins" className={cn(buttonVariants({ size: 'lg', className: 'mt-1 font-extrabold' }))}>
            Voltar para check-ins
          </Link>
        </section>
      </>,
    )
  }
  if (!c) return shell(<>{header}<ErrorState title="Check-in não encontrado" retrying={query.isFetching} onRetry={() => navigate('/check-ins')} /></>)

  const position = queue.indexOf(id)
  const remaining = queue.filter((q) => !answered.includes(q)).length
  const isAnswered = !!c.reply || answered.includes(c.id)

  return shell(
    <>
      {header}
      {inQueue && (
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon-sm" aria-label="Check-in anterior" onClick={() => go(queue[(position - 1 + queue.length) % queue.length]!)} className="rounded-full border-input">
            <ChevronLeft aria-hidden="true" />
          </Button>
          <div className="flex grow flex-col gap-1.5">
            <span className="text-center text-xs font-bold text-foreground-2">
              {position + 1} de {queue.length} · {remaining} aguardando
            </span>
            <div role="img" aria-label={`${queue.length - remaining} de ${queue.length} check-ins respondidos`} className="flex gap-1">
              {queue.map((q) => (
                <span key={q} className={cn('h-1.5 grow rounded-full', answered.includes(q) ? 'bg-primary' : 'bg-secondary', q === id && 'outline-[1.5px] outline-foreground outline-solid')} />
              ))}
            </div>
          </div>
          <Button variant="outline" size="icon-sm" aria-label="Próximo check-in" onClick={() => go(queue[(position + 1) % queue.length]!)} className="rounded-full border-input">
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}

      <CheckInReviewBody key={c.id} checkIn={c} reply={reply} onReply={setReply} />

      {inQueue && !isAnswered && (
        <div className="sticky bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 grid grid-cols-[auto_1fr] gap-2 rounded-full border bg-background/95 p-1.5 backdrop-blur">
          <Button variant="outline" size="lg" onClick={() => go(nextOpen(id) ?? id)} className="font-bold">
            Pular
          </Button>
          <Button
            size="lg"
            disabled={!reply.trim() || send.isPending}
            onClick={() =>
              send.mutate(
                { id: c.id, text: reply.trim(), studentId: c.studentId },
                {
                  onSuccess: () => {
                    const now = [...answered, c.id]
                    setAnswered(now)
                    toast.success(`Resposta enviada para ${firstName(c)}`)
                    const next = nextOpen(c.id, now)
                    if (next) go(next)
                  },
                  onError: () => toast.error('Não foi possível enviar. Tente de novo.'),
                },
              )
            }
            className="font-extrabold"
          >
            {send.isPending ? 'Enviando…' : remaining > 1 ? 'Enviar e próximo' : 'Enviar'}
          </Button>
        </div>
      )}
    </>,
  )
}
