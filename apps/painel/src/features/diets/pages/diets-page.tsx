import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Search } from 'lucide-react'
import { DietGoal, dietGoalLabel, filterDietTemplates, type DietTemplateSummary } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { AssignedList } from '../../plans/components/assigned-list'
import { planTabs } from '../../plans/hooks/use-plan-params'
import { useArchiveDiet, useDiets, useDuplicateDiet, useUnarchiveDiet } from '../api/queries'
import { AssignDietDrawer } from '../components/assign-diet-drawer'
import { DietCard } from '../components/diet-card'
import { useDietParams } from '../hooks/use-diet-params'

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const chipClass = (on: boolean) =>
  cn(
    'h-8.5 shrink-0 rounded-full border px-3 text-xs font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-9 lg:text-[13px]',
    on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2 hover:text-foreground',
  )

/** /dietas: modelos com refeições, substituições e metas; ao atribuir, a ficha pode ser recalculada para o peso do aluno. */
export default function DietsPage() {
  const now = new Date()
  const params = useDietParams()
  const diets = useDiets()
  const duplicate = useDuplicateDiet()
  const archive = useArchiveDiet()
  const unarchive = useUnarchiveDiet()
  const [assigning, setAssigning] = useState<DietTemplateSummary | null>(null)

  const templates = diets.data?.templates ?? []
  const counts = {
    templates: templates.filter((t) => !t.archived).length,
    assigned: diets.data?.assigned.length ?? 0,
    archived: templates.filter((t) => t.archived).length,
  }
  const shown = filterDietTemplates(templates, { archived: params.tab === 'archived', query: params.query, goal: params.goal })
  const q = fold(params.query.trim())
  const assigned = (diets.data?.assigned ?? []).filter((a) => !q || fold(`${a.studentName} ${a.planName}`).includes(q))

  const run = (fn: () => Promise<unknown>, ok: string, fail: string) => fn().then(() => toast.success(ok), () => toast.error(fail))
  const actions = (t: DietTemplateSummary) => ({
    onAssign: () => setAssigning(t),
    onDuplicate: () => run(() => duplicate.mutateAsync(t.id), `Cópia de “${t.name}” criada`, 'Não foi possível duplicar. Tente de novo.'),
    onArchive: () => run(() => archive.mutateAsync(t.id), `${t.name} foi arquivada`, 'Não foi possível arquivar. Tente de novo.'),
    onUnarchive: () => run(() => unarchive.mutateAsync(t.id), `${t.name} voltou para os modelos`, 'Não foi possível restaurar. Tente de novo.'),
  })

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
      <header className="flex flex-wrap items-center justify-between gap-2.5 lg:gap-3">
        <Link to="/" aria-label="Voltar" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex grow flex-col gap-1">
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] lg:text-[28px]">Fichas de dieta</h1>
          <span className="hidden text-[13px] text-muted-foreground lg:block">Modelos com refeições, substituições e metas · ao atribuir, a ficha é recalculada para o peso do aluno</span>
        </div>
        <Link to="/dietas/nova" aria-label="Nova ficha de dieta" className={cn(buttonVariants({ size: 'icon', className: 'lg:hidden' }))}>
          <Plus aria-hidden="true" strokeWidth={2.6} className="size-5" />
        </Link>
        <div className="hidden gap-2.5 lg:flex">
          <Button variant="outline" size="lg" onClick={() => toast('A tabela de alimentos chega em breve')} className="font-bold">
            Tabela de alimentos
          </Button>
          <Link to="/dietas/nova" className={cn(buttonVariants({ size: 'lg' }))}>
            <Plus aria-hidden="true" strokeWidth={2.6} />
            Nova ficha de dieta
          </Link>
        </div>
      </header>

      {diets.isError ? (
        <ErrorState title="Não foi possível carregar as dietas" retrying={diets.isFetching} onRetry={() => diets.refetch()} />
      ) : (
        <>
          <div role="tablist" aria-label="Tipo de ficha" className="grid grid-cols-3 gap-1 rounded-[14px] border bg-background p-1 lg:flex lg:gap-1 lg:rounded-none lg:border-0 lg:border-b lg:border-secondary lg:p-0">
            {planTabs.map((t) => {
              const on = params.tab === t.tab
              return (
                <button
                  key={t.tab}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => params.setTab(t.tab)}
                  className={cn(
                    'flex h-10 items-center justify-center gap-1 rounded-[10px] text-[12.5px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    'lg:-mb-px lg:h-11 lg:gap-2 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:px-3.5 lg:text-sm',
                    on ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground' : 'text-foreground-2 lg:border-transparent lg:text-muted-foreground',
                  )}
                >
                  <span className="lg:hidden">{t.label[1]}</span>
                  <span className="hidden lg:inline">{t.label[0]}</span>
                  <span className="lg:flex lg:h-5.5 lg:min-w-5.5 lg:items-center lg:justify-center lg:rounded-full lg:bg-secondary lg:px-1.5 lg:text-[11px] lg:text-foreground-2">{diets.data ? counts[t.tab] : '·'}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-4">
            <label className="flex h-11.5 items-center gap-2.5 rounded-full border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50 lg:h-11 lg:w-90">
              <Search aria-hidden="true" className="size-4.5 text-muted-foreground" />
              <input
                type="search"
                aria-label={params.tab === 'assigned' ? 'Buscar aluno ou dieta' : 'Buscar ficha de dieta'}
                placeholder={params.tab === 'assigned' ? 'Buscar aluno ou dieta' : 'Buscar ficha de dieta'}
                value={params.query}
                onChange={(e) => params.setQuery(e.target.value)}
                className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            {params.tab !== 'assigned' && (
              <div role="group" aria-label="Objetivo" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
                <button type="button" aria-pressed={params.goal === null} onClick={() => params.setGoal(null)} className={chipClass(params.goal === null)}>
                  Todos
                </button>
                {DietGoal.options.map((g) => (
                  <button key={g} type="button" aria-pressed={params.goal === g} onClick={() => params.setGoal(g)} className={chipClass(params.goal === g)}>
                    {dietGoalLabel[g]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!diets.data ? (
            <div aria-busy="true" aria-label="Carregando as dietas" className="grid gap-2.5 lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] lg:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-[20px]" />
              ))}
            </div>
          ) : params.tab === 'assigned' ? (
            <AssignedList items={assigned} now={now} profileTab="dieta" label="Dietas dos alunos" />
          ) : (
            <section aria-label={params.tab === 'archived' ? 'Dietas arquivadas' : 'Modelos de dieta'} className="grid gap-2.5 lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] lg:gap-4">
              {shown.map((t) => (
                <DietCard key={t.id} template={t} now={now} {...actions(t)} />
              ))}
              {shown.length === 0 && <p className="rounded-[18px] border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground lg:col-span-full">Nenhuma ficha com esses filtros.</p>}
            </section>
          )}
        </>
      )}

      {diets.data && <AssignDietDrawer template={assigning} data={diets.data} now={now} onClose={() => setAssigning(null)} />}
    </main>
  )
}
