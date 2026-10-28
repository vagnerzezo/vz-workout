import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import {
  attentionCounts,
  attentionWhen,
  initials,
  type AttentionAction,
  type AttentionFilter,
  type AttentionItem,
} from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useResolveAttention } from '../api/queries'
import { panelClass } from './panel'

/** Filtro na URL (`?atencao=`), como as abas: recarregar mantém e o voltar funciona. */
const filters: { id: AttentionFilter; param: string | null; label: string }[] = [
  { id: 'all', param: null, label: 'Todos' },
  { id: 'checkIn', param: 'check-ins', label: 'Check-ins' },
  { id: 'inactivity', param: 'inatividade', label: 'Inatividade' },
  { id: 'due', param: 'vencimentos', label: 'Vencimentos' },
]

const tags: Record<AttentionItem['type'], { label: string; className: string }> = {
  checkIn: { label: 'Check-in', className: 'bg-info/16 text-info' },
  inactivity: { label: 'Inatividade', className: 'bg-warning/16 text-warning' },
  due: { label: 'Vencimento', className: 'bg-destructive/16 text-destructive' },
}

const actionLabel: Record<AttentionAction, string> = {
  reply: 'Responder',
  viewCheckIn: 'Ver check-in',
  message: 'Enviar mensagem',
  charge: 'Cobrar renovação',
  renewPlan: 'Renovar ficha',
}

function actionHref(item: AttentionItem): string {
  switch (item.action) {
    case 'reply':
    case 'viewCheckIn':
      return item.targetId ? `/check-ins/revisar/${item.targetId}` : '/check-ins'
    case 'message':
      return item.targetId ? `/chat/${item.targetId}` : '/chat'
    case 'charge':
      return '/financeiro'
    case 'renewPlan':
      return `/alunos/${item.studentId}?aba=treino`
  }
}

export function AttentionList({ items, now }: { items: AttentionItem[]; now: Date }) {
  const [params, setParams] = useSearchParams()
  const current = filters.find((f) => f.param === params.get('atencao')) ?? filters[0]!
  const counts = attentionCounts(items)
  const shown = items.filter((i) => current.id === 'all' || i.type === current.id)
  const resolve = useResolveAttention()

  const pick = (param: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (param) next.set('atencao', param)
        else next.delete('atencao')
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const markResolved = (item: AttentionItem) =>
    resolve.mutate(item.id, {
      onSuccess: () => toast.success(`${item.studentName}: marcado como resolvido`),
      onError: () => toast.error('Não foi possível marcar como resolvido. Tente de novo.'),
    })

  return (
    <section aria-labelledby="atencao-titulo" className="flex flex-col gap-3 lg:rounded-[22px] lg:border lg:bg-card lg:p-5 lg:gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3 lg:items-center">
        <div className="flex flex-col gap-0.5">
          <h2 id="atencao-titulo" className="text-lg font-extrabold">
            Precisa da sua atenção
          </h2>
          <span className="hidden text-[13px] text-muted-foreground lg:block">Check-ins sem resposta, queda de adesão e vencimentos</span>
        </div>
        <span className="text-[13px] font-extrabold text-primary lg:hidden">{counts.all === 1 ? '1 item' : `${counts.all} itens`}</span>
        <div role="group" aria-label="Filtrar" className="-mx-4 flex w-[calc(100%+2rem)] gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:w-auto lg:flex-wrap lg:px-0">
          {filters.map((f) => {
            const on = f.id === current.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => pick(f.param)}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-3 text-xs font-extrabold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-8.5 lg:text-[13px] lg:font-bold',
                  on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2 hover:text-foreground',
                )}
              >
                {f.label} · {counts[f.id]}
              </button>
            )
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-line-strong p-5.5 text-center text-sm text-muted-foreground lg:rounded-none lg:border-0 lg:py-6">
          Tudo em dia nesta categoria.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 lg:gap-0">
          {shown.map((item) => {
            const tag = tags[item.type]
            return (
              <li
                key={item.id}
                className={cn(
                  panelClass,
                  'gap-2.5 rounded-[18px] p-3.5',
                  'lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-3 lg:rounded-none lg:border-0 lg:border-t lg:border-t-[#22252b] lg:bg-transparent lg:px-0 lg:py-3 lg:first:border-t-0',
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5 lg:flex-[1_1_200px] lg:gap-3">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-xs font-extrabold lg:text-[13px]">
                    {initials(item.studentName)}
                  </span>
                  <div className="flex min-w-0 grow flex-col">
                    <strong className="text-[15px] font-extrabold lg:text-sm">{item.studentName}</strong>
                    <span className="text-xs text-muted-foreground">{attentionWhen(item, now)}</span>
                  </div>
                  <span className={cn('flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-extrabold lg:hidden', tag.className)}>{tag.label}</span>
                </div>
                <p className="text-sm leading-[1.45] text-foreground-2 lg:flex-[2_1_260px]">{item.reason}</p>
                <span className={cn('hidden h-6.5 items-center rounded-full px-2.5 text-xs font-extrabold lg:flex', tag.className)}>{tag.label}</span>
                <div className="flex gap-2">
                  <Link to={actionHref(item)} className={buttonVariants({ className: 'h-11 grow lg:h-9.5 lg:grow-0 lg:px-3.5 lg:text-[13px]' })}>
                    {actionLabel[item.action]}
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Marcar ${item.studentName} como resolvido`}
                    onClick={() => markResolved(item)}
                    className="size-11 border-input text-foreground-2 lg:size-9.5 lg:text-muted-foreground"
                  >
                    <Check aria-hidden="true" strokeWidth={2.6} />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
