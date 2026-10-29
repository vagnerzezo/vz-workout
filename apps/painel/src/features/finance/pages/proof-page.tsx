import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { formatBRL, initials, shortDate, sortCharges, parseIsoDate } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useFinance } from '../api/queries'
import { decisionText, ProofReview } from '../components/proof-review'
import { FinancePage } from './finance-page'

/** /financeiro/comprovantes/:id: no celular, a conferência em sequência; no desktop, o financeiro com o comprovante ao lado. */
export default function ProofRoute() {
  const { id = '' } = useParams()
  return useIsDesktop() ? <FinancePage selectedId={id} /> : <ProofSequence id={id} />
}

function ProofSequence({ id }: { id: string }) {
  const navigate = useNavigate()
  const query = useFinance()
  // A fila da sessão fica fixa: os já decididos continuam na barra de progresso
  const [queue, setQueue] = useState<string[] | null>(null)

  const shell = (children: React.ReactNode) => <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">{children}</main>
  if (query.isError) return shell(<ErrorState title="Não foi possível carregar o comprovante" retrying={query.isFetching} onRetry={() => query.refetch()} />)
  const data = query.data
  if (!data) return shell(<Skeleton aria-label="Carregando o comprovante" className="h-[70vh] rounded-[20px]" />)

  const order = queue ?? sortCharges(data.charges.filter((c) => c.status === 'review')).map((c) => c.id)
  if (!queue && order.length) setQueue(order)
  const list = order.map((x) => data.charges.find((c) => c.id === x)!).filter(Boolean)
  const decided = list.filter((c) => c.status !== 'review')
  const done = list.length > 0 && decided.length === list.length
  const c = data.charges.find((x) => x.id === id)
  const position = order.indexOf(id)
  const nextOpen = () => list.find((x) => x.status === 'review' && x.id !== id)?.id

  const header = (
    <header className="flex items-center gap-2.5">
      <Link to="/financeiro" aria-label="Voltar para o financeiro" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Link>
      <div className="flex grow flex-col gap-1.5">
        <h1 className="text-base font-extrabold">Conferir comprovantes</h1>
        <div role="img" aria-label={`${decided.length} de ${list.length} comprovantes conferidos`} className="flex gap-1">
          {list.map((x) => (
            <span key={x.id} className={cn('h-1.25 grow rounded-full', x.status === 'paid' ? 'bg-primary' : x.status === 'rejected' ? 'bg-destructive' : 'bg-secondary', x.id === id && !done && 'outline-[1.5px] outline-foreground outline-solid')} />
          ))}
        </div>
      </div>
      <span className="shrink-0 text-[13px] font-extrabold text-foreground-2">{done ? `${list.length}/${list.length}` : position >= 0 ? `${position + 1} de ${list.length}` : ''}</span>
    </header>
  )

  if (done) {
    const paid = decided.filter((x) => x.status === 'paid')
    const rejected = decided.length - paid.length
    return shell(
      <>
        {header}
        <section aria-label="Conferência concluída" className="mt-8 flex flex-col items-center gap-3 rounded-3xl border bg-card px-5 py-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" strokeWidth={2.8} className="size-7.5" />
          </span>
          <h2 className="text-xl font-extrabold">Comprovantes conferidos</h2>
          <p className="text-sm leading-normal text-muted-foreground">
            {paid.length} confirmados ({formatBRL(paid.reduce((s, x) => s + x.amount, 0))}){rejected ? ` e ${rejected} recusado${rejected > 1 ? 's' : ''}` : ''}. Os alunos já foram avisados no app.
          </p>
          <Link to="/financeiro" className={cn(buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-1 font-extrabold' }))}>
            Voltar ao financeiro
          </Link>
        </section>
      </>,
    )
  }
  if (!c?.proof) return shell(<>{header}<ErrorState title="Comprovante não encontrado" retrying={false} onRetry={() => navigate('/financeiro')} /></>)

  return shell(
    <>
      {header}
      <section aria-label="Cobrança" className="flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-[13px] font-extrabold">
          {initials(c.studentName)}
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="text-[15px] font-extrabold">{c.studentName}</span>
          <span className="text-xs text-muted-foreground">
            {c.plan} · vence {shortDate(parseIsoDate(c.dueOn))} · enviado {shortDate(new Date(c.proof.sentAt))}
          </span>
        </span>
        <span className="shrink-0 text-[17px] font-extrabold">{formatBRL(c.amount)}</span>
      </section>
      <ProofReview
        key={c.id}
        charge={c}
        finance={data}
        stickyActions
        onDecided={() => {
          const next = nextOpen()
          if (next) navigate(`/financeiro/comprovantes/${next}`, { replace: true })
        }}
      />
      {decisionText(c) && (
        <Button size="lg" variant="outline" onClick={() => navigate(`/financeiro/comprovantes/${nextOpen() ?? c.id}`, { replace: true })} disabled={!nextOpen()} className="font-extrabold">
          Próximo
        </Button>
      )}
    </>,
  )
}
