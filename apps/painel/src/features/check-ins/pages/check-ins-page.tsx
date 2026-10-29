import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { CalendarDays, Pencil, Play } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import { average, formatDecimal, initials, isOverdue, lateLabel, parseIsoDate, reviewOrder, shortDate, timeAgo, type CheckInReview, type CoachCheckIns, type LateCheckIn } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useCheckIns, useRemindCheckIns, useReplyCheckIn } from '../api/queries'
import { AlertChip, CheckInReviewBody, firstName } from '../components/check-in-review'

type Tab = 'waiting' | 'answered' | 'late'
const tabs: { tab: Tab; param: string | null; label: [string, string] }[] = [
  { tab: 'waiting', param: null, label: ['Aguardando resposta', 'Aguardando'] },
  { tab: 'answered', param: 'respondidos', label: ['Respondidos', 'Respondidos'] },
  { tab: 'late', param: 'atrasados', label: ['Atrasados', 'Atrasados'] },
]

const one = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
const signedKg = (c: CheckInReview) => (c.weight.previous === null ? '—' : `${c.weight.now - c.weight.previous > 0 ? '+' : ''}${formatDecimal(c.weight.now - c.weight.previous)} kg`)

function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="flex size-10.5 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-[13px] font-extrabold">
      {initials(name)}
    </span>
  )
}

/** Atrasados: abrir o chat ou mandar lembrete (um a um ou todos). */
function LateList({ late, now }: { late: LateCheckIn[]; now: Date }) {
  const remind = useRemindCheckIns()
  const pending = late.filter((l) => !l.remindedAt)
  const send = (ids: string[], ok: string) => remind.mutate(ids, { onSuccess: () => toast.success(ok), onError: () => toast.error('Não foi possível enviar. Tente de novo.') })
  if (late.length === 0) return <p className="rounded-[18px] border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground">Nenhum check-in atrasado.</p>
  return (
    <div className="flex flex-col gap-2.5">
      <Button variant="outline" size="lg" disabled={pending.length === 0 || remind.isPending} onClick={() => send(pending.map((l) => l.studentId), 'Lembretes enviados')} className={cn('h-12 font-extrabold lg:self-start', pending.length > 0 && 'border-primary text-primary')}>
        {pending.length === 0 ? 'Lembretes enviados a todos' : `Enviar lembrete a todos (${pending.length})`}
      </Button>
      <ul aria-label="Check-ins atrasados" className="flex flex-col gap-2">
        {late.map((l) => (
          <li key={l.studentId} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 lg:flex-nowrap">
            <Avatar name={l.studentName} />
            <span className="flex min-w-0 grow basis-40 flex-col gap-0.5">
              <span className="flex justify-between gap-2">
                <span className="text-sm font-extrabold">{l.studentName}</span>
                <span className="text-xs font-extrabold whitespace-nowrap text-destructive lg:hidden">{lateLabel(l.dueOn, now).replace(' de atraso', '')}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {l.kind} · vencia {shortDate(parseIsoDate(l.dueOn))}
                {l.note && ` · ${l.note}`}
              </span>
            </span>
            <span className="hidden text-xs font-extrabold whitespace-nowrap text-destructive lg:block">{lateLabel(l.dueOn, now)}</span>
            <div className="flex w-full gap-2 lg:w-auto">
              {l.conversationId && (
                <Link to={`/chat/${l.conversationId}`} className={cn(buttonVariants({ variant: 'outline', className: 'h-10 flex-1 font-bold lg:flex-none' }))}>
                  Abrir chat
                </Link>
              )}
              <Button
                variant={l.remindedAt ? 'outline' : 'default'}
                aria-pressed={!!l.remindedAt}
                disabled={!!l.remindedAt || remind.isPending}
                onClick={() => send([l.studentId], `Lembrete enviado para ${l.studentName.split(' ')[0]}`)}
                className={cn('h-10 flex-1 font-extrabold lg:flex-none', l.remindedAt && 'border-primary text-primary disabled:opacity-100')}
              >
                {l.remindedAt ? 'Lembrete enviado' : 'Enviar lembrete'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Desktop: resposta escrita aqui e enviada pelo botão da caixa. */
function DesktopDetail({ checkIn: c, onSent }: { checkIn: CheckInReview; onSent: () => void }) {
  const [reply, setReply] = useState('')
  const send = useReplyCheckIn()
  return (
    <section aria-label="Check-in selecionado" className="flex min-w-0 flex-col gap-4 rounded-[22px] border bg-[#111215] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={c.studentName} />
        <div className="flex min-w-0 grow flex-col">
          <h2 className="text-lg font-extrabold">{c.studentName}</h2>
          <span className="text-xs text-muted-foreground">
            Check-in {c.kind} de {shortDate(new Date(c.sentAt))} · enviado {timeAgo(c.sentAt, new Date())}
            {c.previousOn && ` · comparado com ${shortDate(parseIsoDate(c.previousOn))}`}
          </span>
        </div>
        <Link to={`/alunos/${c.studentId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 font-bold' }))}>
          Abrir perfil
        </Link>
      </div>
      <CheckInReviewBody
        key={c.id}
        checkIn={c}
        reply={reply}
        onReply={setReply}
        replyActions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast('Anexar vídeo chega em breve')} className="h-9 font-bold">
              Anexar vídeo
            </Button>
            <span className="grow" />
            <Button
              disabled={!reply.trim() || send.isPending}
              onClick={() =>
                send.mutate(
                  { id: c.id, text: reply.trim(), studentId: c.studentId },
                  {
                    onSuccess: () => {
                      toast.success(`Resposta enviada para ${firstName(c)}`)
                      setReply('')
                      onSent()
                    },
                    onError: () => toast.error('Não foi possível enviar. Tente de novo.'),
                  },
                )
              }
              className="h-10 font-extrabold"
            >
              {send.isPending ? 'Enviando…' : 'Enviar e marcar como respondido'}
            </Button>
          </>
        }
      />
    </section>
  )
}

function Stats({ data, now, desktop }: { data: CoachCheckIns; now: Date; desktop: boolean }) {
  const over = data.waiting.filter((c) => isOverdue(c, now)).length
  const week = data.answered.filter((c) => c.reply && differenceInCalendarDays(now, new Date(c.reply.at)) < 7).length
  const items = [
    { label: desktop ? 'Aguardando resposta' : 'Aguardando', value: data.waiting.length, className: 'text-primary' },
    { label: desktop ? 'Há mais de 48 h' : 'Mais de 48 h', value: over, className: 'text-destructive' },
    ...(desktop ? [{ label: 'Respondidos na semana', value: week, className: '' }] : []),
    { label: desktop ? 'Envio no prazo (30 dias)' : 'No prazo', value: `${data.onTimeRate}%`, className: '' },
  ]
  return (
    <section aria-label="Resumo dos check-ins">
    <dl className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col gap-px rounded-[14px] border bg-card px-3 py-2.5 lg:rounded-[18px] lg:px-4 lg:py-3.5">
          <dt className="text-[11px] text-muted-foreground lg:text-xs">{i.label}</dt>
          <dd className={cn('text-xl font-extrabold lg:text-[26px]', i.className)}>{i.value}</dd>
        </div>
      ))}
    </dl>
    </section>
  )
}

/** /check-ins (e, no desktop, /check-ins/revisar/:id com aquele check-in aberto). */
export function CheckInsPage({ selectedId = null }: { selectedId?: string | null }) {
  const now = new Date()
  const desktop = useIsDesktop()
  const query = useCheckIns()
  const [params, setParams] = useSearchParams()
  const tab = tabs.find((t) => t.param && t.param === params.get('aba'))?.tab ?? 'waiting'
  const setTab = (t: Tab) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        const p = tabs.find((x) => x.tab === t)!.param
        if (p) next.set('aba', p)
        else next.delete('aba')
        next.delete('id')
        return next
      },
      { replace: true },
    )
  const select = (id: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('id', id)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const data = query.data
  const waiting = data ? reviewOrder(data.waiting) : []
  const counts = { waiting: waiting.length, answered: data?.answered.length ?? 0, late: data?.late.length ?? 0 }
  const list = tab === 'answered' ? (data?.answered ?? []) : waiting
  const current = list.find((c) => c.id === (params.get('id') ?? selectedId)) ?? list[0] ?? null

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-2.5 lg:gap-3">
      <div className="flex grow flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-[-0.4px] lg:text-[28px] lg:tracking-[-0.5px]">Check-ins</h1>
        <span className="hidden text-[13px] text-muted-foreground lg:block">Revise fotos, medidas e respostas e devolva um feedback ao aluno</span>
      </div>
      {desktop ? (
        <div className="flex gap-2.5">
          <Button variant="outline" size="lg" onClick={() => toast('A agenda dos check-ins chega em breve')} className="font-bold">
            Agenda dos check-ins
          </Button>
          <Button variant="outline" size="lg" onClick={() => toast('Editar o formulário chega em breve')} className="font-bold">
            Editar formulário
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Agenda dos check-ins" onClick={() => toast('A agenda dos check-ins chega em breve')} className="rounded-full border-input bg-card">
            <CalendarDays aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Editar formulário de check-in" onClick={() => toast('Editar o formulário chega em breve')} className="rounded-full border-input bg-card">
            <Pencil aria-hidden="true" />
          </Button>
        </div>
      )}
    </header>
  )

  const tabList = (
    <div role="tablist" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-[14px] border bg-background p-1 lg:flex lg:gap-1 lg:rounded-none lg:border-0 lg:border-b lg:border-secondary lg:p-0">
      {tabs.map((t) => {
        const on = tab === t.tab
        return (
          <button
            key={t.tab}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setTab(t.tab)}
            className={cn(
              'flex h-10 items-center justify-center gap-1 rounded-[10px] text-[12.5px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              'lg:-mb-px lg:h-11 lg:gap-2 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:px-3.5 lg:text-sm',
              on ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground' : 'text-foreground-2 lg:border-transparent lg:text-muted-foreground',
            )}
          >
            {desktop ? t.label[0] : t.label[1]}
            <span className="lg:flex lg:h-5.5 lg:min-w-5.5 lg:items-center lg:justify-center lg:rounded-full lg:bg-secondary lg:px-1.5 lg:text-[11px] lg:text-foreground-2">{data ? counts[t.tab] : '·'}</span>
          </button>
        )
      })}
    </div>
  )

  const itemBody = (c: CheckInReview) => (
    <>
      <Avatar name={c.studentName} />
      <span className="flex min-w-0 grow flex-col gap-1">
        <span className="flex justify-between gap-2">
          <span className="text-sm font-extrabold">{c.studentName}</span>
          <span className={cn('text-xs font-bold whitespace-nowrap', tab === 'waiting' && isOverdue(c, now) ? 'text-destructive' : 'text-muted-foreground')}>
            {tab === 'answered' && c.reply ? shortDate(new Date(c.reply.at)) : timeAgo(c.sentAt, now)}
          </span>
        </span>
        {tab === 'answered' && c.reply && !desktop ? (
          <>
            <span className="line-clamp-2 text-[12.5px] leading-[1.45] text-foreground-2">{c.reply.text}</span>
            <span className={cn('text-[11.5px] font-bold', c.reply.read ? 'text-primary' : 'text-muted-foreground')}>{c.reply.read ? 'Lido pelo aluno' : 'Ainda não lido'}</span>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">
              <span className="capitalize">{c.kind}</span> · peso <strong className="text-foreground">{signedKg(c)}</strong> · média <strong className="text-foreground">{one(average(c.ratings.map((r) => r.value)))}</strong>/5
            </span>
            <AlertChip checkIn={c} />
          </>
        )}
      </span>
    </>
  )

  let content
  if (query.isError) content = <ErrorState title="Não foi possível carregar os check-ins" retrying={query.isFetching} onRetry={() => query.refetch()} />
  else if (!data) content = <Skeleton aria-label="Carregando os check-ins" className="h-96 rounded-[20px]" />
  else if (tab === 'late') content = <LateList late={data.late} now={now} />
  else if (desktop)
    content = (
      <div className="grid grid-cols-[minmax(280px,360px)_minmax(0,1fr)] items-start gap-5">
        <section aria-label="Lista de check-ins" className="flex flex-col gap-2 lg:sticky lg:top-5">
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === current?.id}
              onClick={() => select(c.id)}
              className={cn('flex items-start gap-3 rounded-2xl border p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50', c.id === current?.id ? 'border-primary bg-primary/12' : tab === 'waiting' && isOverdue(c, now) ? 'border-destructive/45 bg-card' : 'bg-card')}
            >
              {itemBody(c)}
            </button>
          ))}
          {list.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground">Nenhum check-in aguardando. Tudo respondido.</p>}
        </section>
        {current && <DesktopDetail key={current.id} checkIn={current} onSent={() => setParams((prev) => { const next = new URLSearchParams(prev); next.delete('id'); return next }, { replace: true })} />}
      </div>
    )
  else
    content = (
      <div className="flex flex-col gap-2.5">
        {tab === 'waiting' && waiting.length > 0 && (
          <Link to={`/check-ins/revisar/${waiting[0]!.id}`} className="flex min-h-16 items-center gap-3 rounded-[18px] bg-primary px-4 py-2.5 text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/14">
              <Play aria-hidden="true" className="size-4.5 fill-current" />
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-extrabold">Revisar em sequência</span>
              <span className="text-xs font-semibold opacity-75">
                {waiting.length} check-ins · dor e alertas primeiro · ~{waiting.length * 3} min
              </span>
            </span>
          </Link>
        )}
        <ul aria-label={tab === 'answered' ? 'Respondidos' : 'Aguardando resposta'} className="flex flex-col gap-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link to={`/check-ins/revisar/${c.id}`} className={cn('flex items-start gap-3 rounded-2xl border bg-card p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50', tab === 'waiting' && isOverdue(c, now) && 'border-destructive/45')}>
                {itemBody(c)}
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 && <p className="rounded-[18px] border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground">Nenhum check-in aguardando. Tudo respondido.</p>}
      </div>
    )

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
      {header}
      {data && <Stats data={data} now={now} desktop={desktop} />}
      {tabList}
      {content}
    </main>
  )
}

export default function CheckInsRoute() {
  return <CheckInsPage />
}
