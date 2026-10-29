import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, FileCheck, FileText, Search, X } from 'lucide-react'
import {
  chargeStatusLabel,
  chargeSubtitle,
  chargesToCsv,
  filterCharges,
  financeSummary,
  formatBRL,
  initials,
  monthLabel,
  parseIsoDate,
  shortDate,
  sortCharges,
  type ChargeFilter,
  type CoachCharge,
  type CoachChargeStatus,
  type CoachFinance,
} from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useFinance, useRemindCharge } from '../api/queries'
import { ChargeSheet } from '../components/charge-sheet'
import { PixSettingsForm } from '../components/pix-settings'
import { PlansAndRules } from '../components/plans-rules'
import { ProofReview } from '../components/proof-review'

const statusTone: Record<CoachChargeStatus, string> = {
  review: 'bg-info/16 text-info',
  paid: 'bg-primary/14 text-primary',
  late: 'bg-destructive/16 text-destructive',
  upcoming: 'bg-secondary text-foreground-2',
  rejected: 'bg-destructive/16 text-destructive',
}
const filters: { id: ChargeFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'review', label: 'A conferir' },
  { id: 'paid', label: 'Confirmados' },
  { id: 'late', label: 'Em atraso' },
  { id: 'upcoming', label: 'A vencer' },
]

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

function Summary({ finance, filter, onFilter, desktop }: { finance: CoachFinance; filter: ChargeFilter; onFilter: (f: ChargeFilter) => void; desktop: boolean }) {
  const s = financeSummary(finance.charges)
  const pct = s.expected ? s.received / s.expected : 0
  const box = (id: ChargeFilter, label: string, n: number, amount: number, tone: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={filter === id}
      onClick={() => onFilter(filter === id ? 'all' : id)}
      className={cn('flex flex-col items-start gap-0.5 rounded-[18px] border bg-card px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:px-4 lg:py-3.5', filter === id && 'border-primary')}
    >
      <span className="text-[11px] text-muted-foreground lg:text-xs">{label}</span>
      <span className={cn('text-xl font-extrabold lg:text-[26px]', tone)}>{n}</span>
      <span className="text-[11px] text-muted-foreground lg:text-xs">{formatBRL(amount)}</span>
    </button>
  )
  return (
    <section aria-label="Resumo do mês" className={cn('grid gap-2', desktop ? 'grid-cols-4 gap-4' : 'grid-cols-3')}>
      <div className={cn('flex flex-col gap-1 rounded-[18px] border bg-card px-4 py-3.5', !desktop && 'col-span-3')}>
        <span className="flex items-baseline justify-between text-xs text-muted-foreground">
          Recebido no mês
          {!desktop && <span>{Math.round(pct * 100)}% do previsto</span>}
        </span>
        <span className="text-[26px] font-extrabold">{formatBRL(s.received)}</span>
        <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${(pct * 100).toFixed(1)}%` }} />
        </span>
        <span className="text-xs text-muted-foreground">de {formatBRL(s.expected)} previstos</span>
      </div>
      {box('review', desktop ? 'Comprovantes a conferir' : 'Conferir', s.review.count, s.review.amount, 'text-info')}
      {box('late', 'Em atraso', s.late.count, s.late.amount, 'text-destructive')}
      {box('upcoming', 'A vencer', s.upcoming.count, s.upcoming.amount, '')}
    </section>
  )
}

/** Ação de cada linha: conferir, cobrar (atraso) ou lembrar (a vencer). */
function RowAction({ c, onReview, onCharge, mobile }: { c: CoachCharge; onReview: () => void; onCharge: () => void; mobile: boolean }) {
  const remind = useRemindCharge()
  if (c.status === 'review')
    return mobile ? (
      <Link to={`/financeiro/comprovantes/${c.id}`} className={cn(buttonVariants({ size: 'sm', className: 'h-9 font-extrabold' }))}>
        Conferir
      </Link>
    ) : (
      <Button size="sm" onClick={onReview} className="h-8.5 font-extrabold">
        Conferir
      </Button>
    )
  if (c.status === 'late' || c.status === 'rejected')
    return (
      <Button variant="outline" size="sm" onClick={onCharge} className="h-8.5 border-destructive font-bold text-destructive hover:text-destructive">
        Cobrar
      </Button>
    )
  if (c.status === 'upcoming')
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={!!c.remindedAt || remind.isPending}
        onClick={() => remind.mutate(c.id, { onSuccess: () => toast.success(`Lembrete enviado para ${c.studentName.split(' ')[0]}`) })}
        className={cn('h-8.5 font-bold', c.remindedAt && 'border-primary text-primary disabled:opacity-100')}
      >
        {c.remindedAt ? 'Lembrado' : 'Lembrar'}
      </Button>
    )
  return null
}

function Receivables({ finance, desktop, selectedId }: { finance: CoachFinance; desktop: boolean; selectedId: string | null }) {
  const now = new Date()
  const [params, setParams] = useSearchParams()
  const filter = (filters.find((f) => f.id === params.get('status'))?.id ?? 'all') as ChargeFilter
  const [query, setQuery] = useState('')
  const [charging, setCharging] = useState<string | null>(null)
  const sel = params.get('id') ?? selectedId
  const setParam = (k: string, v: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (v) next.set(k, v)
        else next.delete(k)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  const all = finance.charges
  const shown = sortCharges(filterCharges(all, filter)).filter((c) => !query.trim() || fold(c.studentName).includes(fold(query.trim())))
  const selected = all.find((c) => c.id === sel && c.proof) ?? null
  const reviewQueue = sortCharges(all.filter((c) => c.status === 'review'))
  const count = (f: ChargeFilter) => filterCharges(all, f).length
  const chargeOf = all.find((c) => c.id === charging) ?? null

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div role="tablist" aria-label="Status do pagamento" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setParam('status', f.id === 'all' ? null : f.id)}
            className={cn('h-9 shrink-0 rounded-full border px-3 text-[12.5px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50', filter === f.id ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')}
          >
            {f.label} · {count(f.id)}
          </button>
        ))}
      </div>
      {desktop && (
        <label className="ml-auto flex h-10 w-64 items-center gap-2 rounded-full border bg-card px-3.5 focus-within:ring-3 focus-within:ring-ring/50">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <input type="search" aria-label="Buscar aluno" placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
        </label>
      )}
    </div>
  )

  const status = (c: CoachCharge) => <span className={cn('flex h-6 items-center self-start rounded-full px-2 text-[11px] font-extrabold whitespace-nowrap', statusTone[c.status])}>{chargeStatusLabel[c.status]}</span>

  return (
    <div className="flex flex-col gap-3.5 lg:gap-4">
      <Summary finance={finance} filter={filter} onFilter={(f) => setParam('status', f === 'all' ? null : f)} desktop={desktop} />
      {!desktop && reviewQueue.length > 0 && (
        <Link to={`/financeiro/comprovantes/${reviewQueue[0]!.id}`} className="flex min-h-16 items-center gap-3 rounded-[18px] bg-primary px-4 py-2.5 text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/14">
            <FileCheck aria-hidden="true" className="size-4.5" />
          </span>
          <span className="flex grow flex-col">
            <span className="text-[15px] font-extrabold">Conferir {reviewQueue.length} comprovantes</span>
            <span className="text-xs font-semibold opacity-75">{formatBRL(reviewQueue.reduce((s, c) => s + c.amount, 0))} aguardando confirmação</span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
      )}
      {filterBar}
      {desktop ? (
        <div className={cn('grid items-start gap-5', selected ? 'grid-cols-[minmax(0,1fr)_380px]' : 'grid-cols-1')}>
          <table aria-label="Cobranças do mês" className="w-full border-separate border-spacing-y-1.5 text-[13px]">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.8px] text-muted-foreground">
                {['ALUNO', 'PLANO', 'VALOR', 'VENCIMENTO', 'COMPROVANTE', 'STATUS', 'AÇÃO'].map((h) => (
                  <th key={h} className="px-3 pb-1 font-extrabold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className={cn(c.id === selected?.id ? 'bg-primary/12' : 'bg-card')}>
                  <td className="rounded-l-xl px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="flex size-8.5 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-[11px] font-extrabold">
                        {initials(c.studentName)}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-bold">{c.studentName}</span>
                        <span className={cn('text-[11.5px]', c.status === 'late' ? 'text-destructive' : 'text-muted-foreground')}>{chargeSubtitle(c, now)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-foreground-2">{c.plan}</td>
                  <td className="px-3 py-2.5 font-bold">{formatBRL(c.amount)}</td>
                  <td className={cn('px-3 py-2.5', c.status === 'late' ? 'text-destructive' : 'text-foreground-2')}>{shortDate(parseIsoDate(c.dueOn))}</td>
                  <td className="px-3 py-2.5">
                    {c.proof ? (
                      <Button variant="outline" size="sm" aria-label={`Ver comprovante de ${c.studentName}`} onClick={() => setParam('id', c.id)} className={cn('h-8 font-bold', c.id === selected?.id && 'border-primary text-primary')}>
                        <FileText aria-hidden="true" />
                        Ver
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{status(c)}</td>
                  <td className="rounded-r-xl px-3 py-2.5">
                    <RowAction c={c} mobile={false} onReview={() => setParam('id', c.id)} onCharge={() => setCharging(c.id)} />
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                    Nenhuma cobrança nesse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {selected && (
            <aside aria-label={`Comprovante de ${selected.studentName}`} className="flex flex-col gap-3 rounded-[22px] border bg-[#111215] p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex flex-col gap-0.5">
                  <h2 className="text-[17px] font-extrabold">Comprovante</h2>
                  <span className="text-xs text-muted-foreground">
                    {selected.studentName} · {selected.plan} {formatBRL(selected.amount)} · enviado {shortDate(new Date(selected.proof!.sentAt))}
                  </span>
                </span>
                <Button variant="ghost" size="icon-sm" aria-label="Fechar comprovante" onClick={() => setParam('id', null)}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              <ProofReview
                key={selected.id}
                charge={selected}
                finance={finance}
                compact
                onDecided={(c, st) => {
                  toast.success(st === 'paid' ? `Pagamento de ${c.studentName.split(' ')[0]} confirmado` : `Comprovante de ${c.studentName.split(' ')[0]} recusado`)
                  const next = reviewQueue.find((x) => x.id !== c.id)
                  setParam('id', next ? next.id : null)
                }}
              />
            </aside>
          )}
        </div>
      ) : (
        <ul aria-label="Cobranças" className="flex flex-col gap-2">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-xs font-extrabold">
                {initials(c.studentName)}
              </span>
              <span className="flex min-w-0 grow flex-col gap-1">
                <span className="flex justify-between gap-2">
                  <span className="truncate text-sm font-extrabold">{c.studentName}</span>
                  <span className="text-sm font-extrabold">{formatBRL(c.amount)}</span>
                </span>
                <span className="flex items-center gap-2">
                  {status(c)}
                  <span className={cn('truncate text-xs', c.status === 'late' ? 'text-destructive' : 'text-muted-foreground')}>
                    {c.plan} · {chargeSubtitle(c, now)}
                  </span>
                </span>
              </span>
              <RowAction c={c} mobile onReview={() => {}} onCharge={() => setCharging(c.id)} />
            </li>
          ))}
          {shown.length === 0 && <li className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground">Nenhuma cobrança nesse filtro.</li>}
        </ul>
      )}
      <ChargeSheet charge={chargeOf} pix={finance.pix} onClose={() => setCharging(null)} />
    </div>
  )
}

type Tab = 'receivables' | 'plans' | 'pix'

/** /financeiro (no desktop, /financeiro/comprovantes/:id abre aqui com o comprovante ao lado). */
export function FinancePage({ selectedId = null }: { selectedId?: string | null }) {
  const desktop = useIsDesktop()
  const query = useFinance()
  const [params, setParams] = useSearchParams()
  const tabs: { tab: Tab; param: string | null; label: string }[] = desktop
    ? [
        { tab: 'receivables', param: null, label: 'Recebimentos' },
        { tab: 'plans', param: 'planos', label: 'Planos e regras' },
        { tab: 'pix', param: 'pix', label: 'Configurar Pix' },
      ]
    : [
        { tab: 'receivables', param: null, label: 'Recebimentos' },
        { tab: 'pix', param: 'pix', label: 'Pix e planos' },
      ]
  const raw = params.get('aba')
  const tab: Tab = raw === 'pix' ? 'pix' : raw === 'planos' ? (desktop ? 'plans' : 'pix') : 'receivables'
  const data = query.data

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
      <header className="flex flex-wrap items-center justify-between gap-2.5 lg:gap-3">
        <Link to="/" aria-label="Voltar" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex grow flex-col gap-1">
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] lg:text-[28px]">Financeiro</h1>
          <span className="hidden text-[13px] text-muted-foreground lg:block">Cobranças por Pix, comprovantes enviados pelos alunos e planos</span>
        </div>
        {desktop && data && (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-bold text-foreground-2 capitalize">{monthLabel(data.month)}</span>
            <Button variant="outline" size="lg" onClick={() => download(chargesToCsv(sortCharges(data.charges)), `financeiro-${data.month}.csv`)} className="font-bold">
              Exportar CSV
            </Button>
            <Button size="lg" onClick={() => toast('Lançar pagamento chega em breve')} className="font-extrabold">
              + Lançar pagamento
            </Button>
          </div>
        )}
      </header>

      <div role="tablist" aria-label="Seções do financeiro" className={cn('grid gap-1 rounded-[14px] border bg-background p-1 lg:flex lg:gap-1 lg:rounded-none lg:border-0 lg:border-b lg:border-secondary lg:p-0', tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {tabs.map((t) => {
          const on = tab === t.tab
          return (
            <button
              key={t.tab}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setParams(t.param ? { aba: t.param } : new URLSearchParams(), { replace: true })}
              className={cn(
                'flex h-10 items-center justify-center rounded-[10px] text-[12.5px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                'lg:-mb-px lg:h-11 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:px-3.5 lg:text-sm',
                on ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground' : 'text-foreground-2 lg:border-transparent lg:text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {query.isError ? (
        <ErrorState title="Não foi possível carregar o financeiro" retrying={query.isFetching} onRetry={() => query.refetch()} />
      ) : !data ? (
        <Skeleton aria-label="Carregando o financeiro" className="h-96 rounded-[20px]" />
      ) : tab === 'receivables' ? (
        <Receivables finance={data} desktop={desktop} selectedId={selectedId} />
      ) : tab === 'plans' ? (
        <PlansAndRules finance={data} desktop={desktop} />
      ) : desktop ? (
        <PixSettingsForm key={JSON.stringify(data.pix)} initial={data.pix} desktop />
      ) : (
        <div className="flex flex-col gap-6">
          <PixSettingsForm key={JSON.stringify(data.pix)} initial={data.pix} desktop={false} />
          <PlansAndRules finance={data} desktop={false} />
        </div>
      )}
    </main>
  )
}

export default function FinanceRoute() {
  return <FinancePage />
}
