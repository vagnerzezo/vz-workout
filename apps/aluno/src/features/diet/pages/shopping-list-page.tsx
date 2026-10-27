import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, Share, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { aisleLabels, formatPurchase, shoppingList, toIsoDate } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useDiet } from '../api/queries'
import { useRemoveShoppingExtra, useShoppingList, useToggleShoppingItem } from '../api/shopping'
import { AddExtraDrawer } from '../components/add-extra-drawer'
import { ShoppingGroup, type ShoppingRow } from '../components/shopping-group'

const iconButton =
  'flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

const periods = [
  { weeks: 1, label: '1 semana' },
  { weeks: 2, label: '2 semanas' },
] as const

/** Lista de compras gerada da dieta (?semanas=2 para duas semanas). */
export default function ShoppingListPage() {
  const [params, setParams] = useSearchParams()
  const [today] = useState(() => new Date())
  const weeks = params.get('semanas') === '2' ? 2 : 1

  const diet = useDiet(toIsoDate(today))
  const state = useShoppingList()
  const toggle = useToggleShoppingItem()
  const remove = useRemoveShoppingExtra()

  const plan = diet.data?.plan
  // Base do cálculo: a ficha de dia de treino, a que pede mais comida
  const variant = plan && (plan.variants.find((v) => v.kind === 'training') ?? plan.variants[0]!)

  const groups = variant
    ? [
        ...shoppingList(variant.meals, weeks * 7).map((g) => ({
          title: aisleLabels[g.aisle],
          rows: g.items.map((i): ShoppingRow => ({ id: i.itemId, name: i.name, quantity: formatPurchase(i.amount, i.unit) })),
        })),
        ...(state.data?.extras.length
          ? [{ title: 'Fora do plano', rows: state.data.extras.map((e): ShoppingRow => ({ ...e, removable: true })) }]
          : []),
      ]
    : []
  const rows = groups.flatMap((g) => g.rows)
  const checkedIds = new Set(state.data?.checkedIds)
  const doneCount = rows.filter((r) => checkedIds.has(r.id)).length

  const setWeeks = (w: number) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (w === 1) next.delete('semanas')
        else next.set('semanas', String(w))
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const share = () => {
    const pending = groups
      .map((g) => ({ ...g, rows: g.rows.filter((r) => !checkedIds.has(r.id)) }))
      .filter((g) => g.rows.length > 0)
    const text = pending
      .map((g) => [g.title.toUpperCase(), ...g.rows.map((r) => `• ${r.name}${r.quantity ? ` — ${r.quantity}` : ''}`)].join('\n'))
      .join('\n\n')
    navigator.share?.({ title: 'Lista de compras', text }).catch(() => {}) // o aluno fechou a folha de compartilhar
  }

  const loading = !diet.data || !state.data
  const failed = diet.isError || state.isError
  const retry = () => {
    if (diet.isError) diet.refetch()
    if (state.isError) state.refetch()
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4.5 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <Link to="/dieta" aria-label="Voltar para a dieta" className={iconButton}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        {'share' in navigator && rows.length > 0 && (
          <button type="button" aria-label="Compartilhar lista" onClick={share} className={iconButton}>
            <Share aria-hidden="true" className="size-4.5" strokeWidth={2} />
          </button>
        )}
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-[-0.6px]">Lista de compras</h1>
        {variant && <p className="text-sm text-muted-foreground">Gerada do plano “{variant.label}” · quantidades somadas</p>}
      </header>

      {failed ? (
        <ErrorState title="Não foi possível carregar a lista" onRetry={retry} retrying={diet.isFetching || state.isFetching} />
      ) : loading ? (
        <ListSkeleton />
      ) : !variant ? (
        <NoDiet />
      ) : (
        <>
          <fieldset className="grid grid-cols-2 gap-1 rounded-2xl border bg-sunken p-1">
            <legend className="sr-only">Período</legend>
            {periods.map((p) => (
              <label
                key={p.weeks}
                className={cn(
                  'flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  weeks === p.weeks ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                <input type="radio" name="periodo" className="sr-only" checked={weeks === p.weeks} onChange={() => setWeeks(p.weeks)} />
                {p.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Itens comprados</span>
              <span className="font-extrabold">
                {doneCount} de {rows.length}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Itens comprados"
              aria-valuemin={0}
              aria-valuemax={rows.length}
              aria-valuenow={doneCount}
              className="h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-2 rounded-full bg-primary" style={{ width: `${rows.length ? (doneCount / rows.length) * 100 : 0}%` }} />
            </div>
          </div>

          {groups.map((g) => (
            <ShoppingGroup
              key={g.title}
              title={g.title}
              rows={g.rows}
              checkedIds={checkedIds}
              onToggle={(id, checked) =>
                toggle.mutate({ id, checked }, { onError: () => toast.error('Não foi possível salvar. Tente de novo.') })
              }
              onRemove={(row) => remove.mutate(row.id, { onError: () => toast.error(`Não foi possível remover ${row.name}.`) })}
            />
          ))}

          <AddExtraDrawer />
        </>
      )}
    </main>
  )
}

function NoDiet() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <ShoppingCart aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold">Sua lista ainda está vazia</h2>
        <p className="text-sm text-muted-foreground">Ela é montada a partir da dieta. Assim que a nutri enviar o plano, os itens aparecem aqui.</p>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a lista" className="flex flex-col gap-4.5">
      <Skeleton className="h-13 rounded-2xl" />
      <Skeleton className="h-8 rounded-lg" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-52 rounded-[18px]" />
      ))}
    </div>
  )
}
