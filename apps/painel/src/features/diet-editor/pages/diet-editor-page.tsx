import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft, MoreHorizontal, Pencil } from 'lucide-react'
import { formatInt, parseIsoDate, shortDate, templateMealTotals, templateTargets, templateTotals, type DietTemplate, type Food } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { UnsavedChangesDialog } from '../../../shared/components/unsaved-changes-dialog'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useDietTemplate, useFoods, useSaveDiet, useStudentName } from '../api/queries'
import { ComparePanel } from '../components/compare-panel'
import { FoodTable } from '../components/food-table'
import { MealCard } from '../components/meal-card'
import { TargetsDesktop, TargetsMobile, type TargetsPatch } from '../components/targets-panel'
import { useDietDraft } from '../hooks/use-diet-draft'

/** A refeição que abre primeiro: o almoço (como no canvas) ou a primeira. */
const firstOpen = (t: DietTemplate) => (t.meals.find((m) => m.name === 'Almoço') ?? t.meals[0])?.id ?? null

/**
 * /dietas/:id — editor de um modelo de dieta; com `?aluno=` edita a cópia daquele aluno (o link da aba Dieta do perfil).
 * A dieta fica em rascunho na tela até "Salvar".
 */
export default function DietEditorPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const studentId = params.get('aluno')
  const isDesktop = useIsDesktop()
  const source = useDietTemplate(id, studentId)
  const foodsQuery = useFoods()
  const studentName = useStudentName(studentId)
  const draft = useDietDraft()
  const save = useSaveDiet(id, studentId)
  const [openMeal, setOpenMeal] = useState<string | null>(null)
  const [sheetMeal, setSheetMeal] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [savedNow, setSavedNow] = useState(false)

  const loadedFor = useRef<string | null>(null)
  const key = `${id}:${studentId ?? ''}`
  const { dispatch } = draft
  useEffect(() => {
    if (source.data && loadedFor.current !== key) {
      loadedFor.current = key
      dispatch({ type: 'load', template: source.data })
      setOpenMeal(firstOpen(source.data))
    }
  }, [source.data, key, dispatch])

  const backTo = studentId ? `/alunos/${studentId}?aba=dieta` : '/dietas'
  const backLabel = studentId ? 'Voltar para o aluno' : 'Voltar para fichas de dieta'
  const shell = (children: ReactNode) => (
    <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-5 lg:pb-10">{children}</main>
  )

  if (source.isError || foodsQuery.isError) {
    return shell(
      <>
        <Link to={backTo} aria-label={backLabel} className="flex size-11 items-center justify-center rounded-full border bg-card">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <ErrorState title="Não foi possível abrir a dieta" retrying={source.isFetching} onRetry={() => void source.refetch()} />
      </>,
    )
  }
  const t = draft.template
  if (!t || !foodsQuery.data || (studentId && !studentName.data)) return shell(<Skeleton aria-label="Carregando a dieta" className="h-[70vh] rounded-[20px]" />)

  const foods: Record<string, Food> = Object.fromEntries(foodsQuery.data.map((f) => [f.id, f]))
  const { targets } = templateTargets(t)
  const totals = templateTotals(t.meals, foods)
  const meal = (mealId: string | null) => t.meals.find((m) => m.id === mealId) ?? null
  const savedLabel = draft.dirty ? 'alterações não salvas' : savedNow ? 'salvo agora' : `atualizada em ${shortDate(parseIsoDate(t.updatedAt))}`

  const doSave = () =>
    save.mutate(t, {
      onSuccess: (saved) => {
        dispatch({ type: 'load', template: saved })
        setSavedNow(true)
        toast.success(studentId ? `Dieta de ${studentName.data!.split(' ')[0]} salva` : 'Dieta salva')
      },
      onError: () => toast.error('Não foi possível salvar. Tente de novo.'),
    })

  const mealCards = t.meals.map((m) => (
    <MealCard
      key={m.id}
      meal={m}
      foods={foods}
      open={openMeal === m.id}
      desktop={isDesktop}
      onToggle={() => setOpenMeal(openMeal === m.id ? null : m.id)}
      onGrams={(rowId, grams, step) => dispatch({ type: 'grams', mealId: m.id, rowId, grams, step })}
      onRemove={(rowId) => dispatch({ type: 'removeFood', mealId: m.id, rowId })}
      onAddSub={(rowId, foodId) => dispatch({ type: 'addSub', mealId: m.id, rowId, foodId })}
      onRemoveSub={(rowId, foodId) => dispatch({ type: 'removeSub', mealId: m.id, rowId, foodId })}
      onAddFood={() => setSheetMeal(m.id)}
    />
  ))

  const title = renaming ? (
    <input
      autoFocus
      aria-label="Nome da dieta"
      defaultValue={t.name}
      onBlur={(e) => {
        const name = e.target.value.trim()
        if (name && name !== t.name) dispatch({ type: 'patch', patch: { name } })
        setRenaming(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setRenaming(false)
      }}
      className="h-10 w-full min-w-0 rounded-xl border bg-card px-3 text-lg font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  ) : (
    <h1 className="text-lg leading-tight font-extrabold lg:text-[22px]">{t.name}</h1>
  )
  const badge = <span className="flex h-6 shrink-0 items-center rounded-full bg-primary/12 px-2.5 text-[11px] font-extrabold text-primary">{studentId ? studentName.data : 'Modelo'}</span>
  const newMealButton = (
    <Button variant="outline" size="lg" onClick={() => dispatch({ type: 'addMeal' })} className="h-12 border-dashed font-bold">
      + Nova refeição
    </Button>
  )
  const notes = (
    <section aria-labelledby="obs-dieta" className="flex flex-col gap-2 rounded-[20px] border bg-card p-4">
      <label id="obs-dieta" htmlFor="obs-dieta-texto" className="text-[15px] font-extrabold">
        Observações para o aluno
      </label>
      <textarea
        id="obs-dieta-texto"
        rows={4}
        value={t.notes}
        onChange={(e) => dispatch({ type: 'patch', patch: { notes: e.target.value } })}
        className="rounded-xl border bg-background p-3 text-[13px] leading-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </section>
  )
  const leave = <UnsavedChangesDialog dirty={draft.dirty} what="desta dieta" />
  const patch = (p: TargetsPatch) => dispatch({ type: 'patch', patch: p })

  if (isDesktop) {
    const open = meal(openMeal)
    const maxMeal = Math.max(1, ...t.meals.map((m) => templateMealTotals(m, foods).kcal))
    return shell(
      <>
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-secondary pb-4">
          <Link to={backTo} aria-label={backLabel} className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Link>
          <div className="flex min-w-0 grow basis-80 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {title}
              {!renaming && (
                <Button variant="ghost" size="icon-sm" aria-label="Renomear dieta" onClick={() => setRenaming(true)}>
                  <Pencil aria-hidden="true" />
                </Button>
              )}
              {badge}
            </div>
            <span className="text-[13px] text-muted-foreground">
              {t.meals.length} refeições · aparece no app como “{t.appLabel}” · {savedLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" onClick={() => toast('A pré-visualização no app chega em breve')} className="font-bold">
              Pré-visualizar no app
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.print()} className="font-bold">
              Gerar PDF
            </Button>
            <Button size="lg" disabled={!draft.dirty || save.isPending} onClick={doSave} className="px-5 font-extrabold">
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </header>

        <TargetsDesktop template={t} onPatch={patch} />

        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
          <section aria-label="Refeições" className="flex min-w-0 flex-col gap-2.5">
            {mealCards}
            {newMealButton}
          </section>
          <aside aria-label="Totais e alimentos" className="flex flex-col gap-4">
            <ComparePanel plan={totals} target={targets} />
            <section aria-labelledby="kcal-refeicao" className="flex flex-col gap-2.5 rounded-[20px] border bg-card p-4">
              <h2 id="kcal-refeicao" className="text-[15px] font-extrabold">
                Calorias por refeição
              </h2>
              <ul className="flex flex-col gap-2">
                {t.meals.map((m) => {
                  const kcal = templateMealTotals(m, foods).kcal
                  return (
                    <li key={m.id} className="grid grid-cols-[96px_minmax(0,1fr)_88px] items-center gap-2 text-xs">
                      <span className="truncate text-foreground-2">{m.name}</span>
                      <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-secondary">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${((kcal / maxMeal) * 100).toFixed(1)}%` }} />
                      </span>
                      <span className="text-right">
                        <strong>{formatInt(Math.round(kcal))}</strong> <span className="text-muted-foreground">{Math.round((kcal / (totals.kcal || 1)) * 100)}%</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
            <section aria-labelledby="tabela-alimentos" className="flex max-h-[70vh] flex-col gap-3 rounded-[20px] border bg-card p-4">
              <div className="flex flex-col gap-0.5">
                <h2 id="tabela-alimentos" className="text-[15px] font-extrabold">
                  Adicionar a: {open?.name ?? 'abra uma refeição'}
                </h2>
                <span className="text-[11px] text-muted-foreground">Valores por 100 g, aproximados da Tabela TACO · whey pelo rótulo</span>
              </div>
              <FoodTable foods={foodsQuery.data} mealName={open?.name ?? null} onAdd={(f) => open && dispatch({ type: 'addFood', mealId: open.id, food: f })} />
            </section>
            {notes}
          </aside>
        </div>
        {leave}
      </>,
    )
  }

  const sheet = meal(sheetMeal)
  return shell(
    <>
      <header className="flex items-center gap-2.5">
        <Link to={backTo} aria-label={backLabel} className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          {title}
          <span className="truncate text-xs text-muted-foreground">{studentId ? `${studentName.data} · ${savedLabel}` : savedLabel}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Mais opções da dieta" className="shrink-0 rounded-full border-input" />}>
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => setRenaming(true)}>Renomear</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>Gerar PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ComparePanel plan={totals} target={targets} />
      <TargetsMobile template={t} onPatch={patch} />

      <section aria-label="Refeições" className="flex flex-col gap-2.5">
        {mealCards}
        {newMealButton}
      </section>
      {notes}

      <div className={cn('sticky bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 grid grid-cols-[auto_1fr] gap-2 rounded-full border bg-background/95 p-1.5 backdrop-blur')}>
        <Button variant="outline" size="lg" onClick={() => toast('A pré-visualização no app chega em breve')} className="font-bold">
          Ver como aluno
        </Button>
        <Button size="lg" disabled={!draft.dirty || save.isPending} onClick={doSave} className="font-extrabold">
          {save.isPending ? 'Salvando…' : draft.dirty ? 'Salvar alterações' : 'Salvo'}
        </Button>
      </div>

      <Drawer open={sheet !== null} onOpenChange={(o) => !o && setSheetMeal(null)}>
        <DrawerContent className="mx-auto max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="text-[17px] font-extrabold">Adicionar a: {sheet?.name}</DrawerTitle>
            <DrawerDescription className="text-xs">Valores por 100 g · Tabela TACO · whey pelo rótulo</DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-col px-4 pt-3 pb-4">
            <FoodTable
              foods={foodsQuery.data}
              mealName={sheet?.name ?? null}
              onAdd={(f) => {
                if (sheet) dispatch({ type: 'addFood', mealId: sheet.id, food: f })
                setSheetMeal(null)
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
      {leave}
    </>,
  )
}
