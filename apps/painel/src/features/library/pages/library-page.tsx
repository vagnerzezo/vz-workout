import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Camera, ChevronLeft, ChevronRight, FileText, Link2, Play, Plus, Search, Video } from 'lucide-react'
import {
  audioDuration,
  exerciseGroups,
  filterExercises,
  filterFoods,
  foodOriginLabel,
  householdLabel,
  muscleLabel,
  type ExerciseFilters,
  type ExerciseGroup,
  type LibraryExercise,
  type LibraryFood,
} from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useExerciseDetail, useLibrary, useShareMaterial } from '../api/queries'
import { ExerciseDetailBody, VideoBox } from '../components/exercise-detail'
import { NewExerciseForm } from '../components/new-exercise-form'

type Tab = 'exercises' | 'foods' | 'materials'
const tabParams: Record<Tab, string | null> = { exercises: null, foods: 'alimentos', materials: 'materiais' }
const chip = (on: boolean) => cn('h-8.5 shrink-0 rounded-full border px-3 text-[12.5px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')
const one = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

function ExerciseCard({ e, selected, desktop, onPick }: { e: LibraryExercise; selected: boolean; desktop: boolean; onPick: () => void }) {
  const body = (
    <>
      <span className="relative flex h-16 w-22 shrink-0 items-center justify-center rounded-xl bg-sunken text-muted-foreground">
        {e.videoSeconds ? (
          <>
            <Play aria-hidden="true" className="size-5 fill-current" />
            <span className="absolute right-1 bottom-1 rounded bg-background/80 px-1 text-[10px] font-bold">{audioDuration(e.videoSeconds)}</span>
          </>
        ) : (
          <span className="text-[10.5px] font-bold">Sem vídeo</span>
        )}
      </span>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-extrabold">{e.name}</span>
          {e.origin === 'coach' && <span className="shrink-0 rounded bg-primary/14 px-1.5 text-[10px] font-extrabold text-primary">MEU</span>}
        </span>
        <span className="truncate text-xs text-foreground-2">
          <strong>{muscleLabel[e.primary]}</strong>
          {e.secondary.length > 0 && ` · ${e.secondary.map((m) => muscleLabel[m]).join(', ')}`}
        </span>
        <span className="text-[11.5px] text-muted-foreground">
          {e.equipment} · em {e.uses === 1 ? '1 ficha' : `${e.uses} fichas`}
        </span>
      </span>
    </>
  )
  const cls = cn('flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50', selected ? 'border-primary bg-primary/12' : 'bg-card')
  return desktop ? (
    <button type="button" aria-pressed={selected} onClick={onPick} className={cls}>
      {body}
    </button>
  ) : (
    <Link to={`/biblioteca/exercicios/${e.id}`} className={cls}>
      {body}
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function Exercises({ list, desktop, selectedId }: { list: LibraryExercise[]; desktop: boolean; selectedId: string | null }) {
  const [params, setParams] = useSearchParams()
  const [f, setF] = useState<ExerciseFilters>({ query: '', group: null, origin: 'all', noVideo: false })
  const [creating, setCreating] = useState(params.get('novo') === '1')
  const shown = filterExercises(list, f)
  const sel = params.get('id') ?? selectedId ?? (desktop ? (shown[0]?.id ?? null) : null)
  const detail = useExerciseDetail(desktop ? sel : null)
  const noVideo = list.filter((e) => e.videoSeconds === null).length
  const pick = (id: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('id', id)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  const groups: (ExerciseGroup | null)[] = [null, ...exerciseGroups]

  const filters = (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
      <label className="flex h-11 items-center gap-2.5 rounded-full border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50 lg:w-72">
        <Search aria-hidden="true" className="size-4.5 text-muted-foreground" />
        <input type="search" aria-label="Buscar exercício" placeholder="Buscar exercício" value={f.query} onChange={(e) => setF({ ...f, query: e.target.value })} className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </label>
      <div role="group" aria-label="Grupo muscular" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {groups.map((g) => (
          <button key={g ?? 'todos'} type="button" aria-pressed={f.group === g} onClick={() => setF({ ...f, group: g })} className={chip(f.group === g)}>
            {g ?? 'Todos'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 lg:ml-auto">
        <div role="radiogroup" aria-label="Origem" className="flex gap-1 rounded-full border p-1">
          {(
            [
              ['all', 'Todos'],
              ['base', 'Base'],
              ['coach', 'Meus'],
            ] as const
          ).map(([o, label]) => (
            <button key={o} type="button" role="radio" aria-checked={f.origin === o} onClick={() => setF({ ...f, origin: o })} className={cn('h-7.5 rounded-full px-3 text-xs font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', f.origin === o ? 'bg-primary text-primary-foreground' : 'text-foreground-2')}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" aria-pressed={f.noVideo} onClick={() => setF({ ...f, noVideo: !f.noVideo })} className={chip(f.noVideo)}>
          {noVideo} sem vídeo
        </button>
      </div>
    </div>
  )

  const form = <NewExerciseForm onCancel={() => setCreating(false)} onDone={(e) => (setCreating(false), pick(e.id))} />

  return (
    <div className="flex flex-col gap-3.5 lg:gap-4">
      {filters}
      {desktop && creating && (
        <section aria-label="Novo exercício" className="rounded-[22px] border bg-[#111215] p-5">
          <h2 className="mb-4 text-[17px] font-extrabold">Novo exercício</h2>
          {form}
        </section>
      )}
      <div className={cn(desktop && 'grid grid-cols-[minmax(0,1fr)_400px] items-start gap-5')}>
        <section aria-label="Exercícios" className={cn('grid grid-cols-[minmax(0,1fr)] gap-2', desktop && 'xl:grid-cols-2')}>
          {shown.map((e) => (
            <ExerciseCard key={e.id} e={e} desktop={desktop} selected={desktop && e.id === sel} onPick={() => pick(e.id)} />
          ))}
          {shown.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground">Nenhum exercício com esses filtros.</p>}
        </section>
        {desktop && sel && (
          <aside aria-label="Detalhes do exercício" className="flex flex-col gap-4 rounded-[22px] border bg-[#111215] p-4 lg:sticky lg:top-5">
            {detail.data && <VideoBox exercise={detail.data.exercise} />}
            <ExerciseDetailBody key={sel} detail={detail.data} library={list} showActions />
          </aside>
        )}
      </div>
      {!desktop && (
        <Drawer open={creating} onOpenChange={setCreating}>
          <DrawerContent className="mx-auto max-h-[90dvh] max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
            <DrawerHeader className="pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
              <DrawerTitle className="text-[17px] font-extrabold">Novo exercício</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pt-2 pb-5">{form}</div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}

function Foods({ foods, desktop }: { foods: LibraryFood[]; desktop: boolean }) {
  const [origin, setOrigin] = useState<'all' | LibraryFood['origin']>('all')
  const [query, setQuery] = useState('')
  const shown = filterFoods(foods, origin, query)
  return (
    <div className="flex flex-col gap-3.5">
      {!desktop && (
        <button type="button" onClick={() => toast('Cadastrar pelo rótulo chega em breve')} className="flex min-h-15 items-center gap-3 rounded-2xl border bg-card px-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/14 text-primary">
            <Camera aria-hidden="true" className="size-4.5" />
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-sm font-extrabold">Cadastrar pelo rótulo</span>
            <span className="text-[11.5px] text-muted-foreground">Fotografe a tabela nutricional e confira os valores</span>
          </span>
        </button>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Origem do alimento" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {(
            [
              ['all', 'Todos'],
              ['taco', 'TACO'],
              ['label', 'Rótulo'],
              ['coach', 'Meus'],
            ] as const
          ).map(([o, label]) => (
            <button key={o} type="button" role="radio" aria-checked={origin === o} onClick={() => setOrigin(o)} className={chip(origin === o)}>
              {label}
            </button>
          ))}
        </div>
        <label className="flex h-10 grow items-center gap-2 rounded-full border bg-card px-3.5 focus-within:ring-3 focus-within:ring-ring/50 lg:max-w-72 lg:grow-0">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <input type="search" aria-label="Buscar alimento" placeholder="Buscar alimento" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
        </label>
        {desktop && <span className="ml-auto text-xs text-muted-foreground">Base: Tabela TACO 4ª edição (NEPA/Unicamp) + alimentos que você cadastrar</span>}
      </div>
      {desktop ? (
        <table aria-label="Alimentos" className="w-full border-separate border-spacing-y-1 text-[13px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.8px] text-muted-foreground">
              {['ALIMENTO (100 G)', 'ORIGEM', 'KCAL', 'P', 'C', 'G', 'MEDIDA CASEIRA', 'EM DIETAS'].map((h) => (
                <th key={h} className="px-3 pb-1 font-extrabold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((f) => (
              <tr key={f.id} className="bg-card">
                <td className="rounded-l-xl px-3 py-2.5 font-bold">{f.name}</td>
                <td className="px-3 py-2.5 text-foreground-2">{foodOriginLabel[f.origin]}</td>
                <td className="px-3 py-2.5 font-bold">{f.per100.kcal}</td>
                <td className="px-3 py-2.5 text-protein">{one(f.per100.protein)}</td>
                <td className="px-3 py-2.5 text-carb">{one(f.per100.carbs)}</td>
                <td className="px-3 py-2.5 text-fat">{one(f.per100.fat)}</td>
                <td className="px-3 py-2.5 text-foreground-2">{householdLabel(f)}</td>
                <td className="rounded-r-xl px-3 py-2.5 text-foreground-2">{f.diets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul aria-label="Alimentos" className="flex flex-col gap-2">
          {shown.map((f) => (
            <li key={f.id} className="flex flex-col gap-1 rounded-2xl border bg-card p-3">
              <span className="flex justify-between gap-2">
                <span className="text-sm font-extrabold">{f.name}</span>
                <span className="text-[11px] font-bold text-muted-foreground">{foodOriginLabel[f.origin]}</span>
              </span>
              <span className="flex justify-between gap-2 text-xs">
                <span>
                  <strong>{f.per100.kcal} kcal</strong> · <span className="text-protein">P {one(f.per100.protein)}</span> · <span className="text-carb">C {one(f.per100.carbs)}</span> · <span className="text-fat">G {one(f.per100.fat)}</span>
                </span>
                <span className="text-muted-foreground">{f.diets} dietas</span>
              </span>
              <span className="text-[11.5px] text-muted-foreground">{householdLabel(f)}</span>
            </li>
          ))}
        </ul>
      )}
      {!desktop && <span className="text-center text-[11.5px] text-muted-foreground">Valores por 100 g · Tabela TACO 4ª edição (NEPA/Unicamp)</span>}
    </div>
  )
}

function Materials({ materials, desktop }: { materials: NonNullable<ReturnType<typeof useLibrary>['data']>['materials']; desktop: boolean }) {
  const share = useShareMaterial()
  const [shared, setShared] = useState<string[]>([])
  const icon = { pdf: FileText, video: Video, link: Link2 }
  return (
    <ul aria-label="Materiais" className={cn('grid gap-2', desktop && 'grid-cols-2 gap-3 xl:grid-cols-3')}>
      {materials.map((m) => {
        const Icon = icon[m.kind]
        return (
          <li key={m.id} className="flex flex-col gap-2.5 rounded-[18px] border bg-card p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/16 text-info">
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-extrabold">{m.title}</span>
                <span className="text-xs text-muted-foreground">
                  {m.meta} · {m.audience}
                </span>
              </span>
            </div>
            {desktop && <p className="text-[13px] leading-normal text-foreground-2">{m.description}</p>}
            <span className="text-xs text-muted-foreground">
              {m.views} de {m.students} alunos viram
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={shared.includes(m.id) || share.isPending}
              onClick={() => share.mutate(m.id, { onSuccess: () => (setShared([...shared, m.id]), toast.success('Material enviado aos alunos')) })}
              className="h-9 self-start font-bold"
            >
              {shared.includes(m.id) ? 'Enviado' : 'Enviar aos alunos'}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

/** /biblioteca (e, no desktop, /biblioteca/exercicios/:id com o exercício aberto ao lado). */
export function LibraryPage({ selectedId = null }: { selectedId?: string | null }) {
  const desktop = useIsDesktop()
  const query = useLibrary()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('aba') === 'alimentos' ? 'foods' : params.get('aba') === 'materiais' ? 'materials' : 'exercises'
  const data = query.data
  const counts = { exercises: data?.exercises.length, foods: data?.foods.length, materials: data?.materials.length }
  const newLabel = tab === 'foods' ? 'Novo alimento' : tab === 'materials' ? 'Novo material' : 'Novo exercício'
  const startNew = () => (tab === 'exercises' ? setParams({ novo: '1' }, { replace: true }) : toast(`${newLabel} chega em breve`))

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
      <header className="flex flex-wrap items-center justify-between gap-2.5 lg:gap-3">
        <Link to="/" aria-label="Voltar" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex grow flex-col gap-1">
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] lg:text-[28px]">Biblioteca</h1>
          <span className="hidden text-[13px] text-muted-foreground lg:block">Exercícios, alimentos e materiais que você usa nas fichas e envia aos alunos</span>
        </div>
        <Button size={desktop ? 'lg' : 'icon'} aria-label={desktop ? undefined : newLabel} onClick={startNew} className={cn('font-extrabold', !desktop && 'rounded-full')}>
          <Plus aria-hidden="true" strokeWidth={2.6} />
          {desktop && newLabel}
        </Button>
      </header>

      <div role="tablist" aria-label="Tipo de conteúdo" className="grid grid-cols-3 gap-1 rounded-[14px] border bg-background p-1 lg:flex lg:gap-1 lg:rounded-none lg:border-0 lg:border-b lg:border-secondary lg:p-0">
        {(['exercises', 'foods', 'materials'] as const).map((t) => {
          const on = tab === t
          const label = { exercises: 'Exercícios', foods: 'Alimentos', materials: 'Materiais' }[t]
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setParams(tabParams[t] ? { aba: tabParams[t] } : new URLSearchParams(), { replace: true })}
              className={cn(
                'flex h-10 items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                'lg:-mb-px lg:h-11 lg:gap-2 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:px-3.5 lg:text-sm',
                on ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground' : 'text-foreground-2 lg:border-transparent lg:text-muted-foreground',
              )}
            >
              {label}
              {desktop && counts[t] !== undefined && <span className="flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] text-foreground-2">{counts[t]}</span>}
            </button>
          )
        })}
      </div>

      {query.isError ? (
        <ErrorState title="Não foi possível carregar a biblioteca" retrying={query.isFetching} onRetry={() => query.refetch()} />
      ) : !data ? (
        <Skeleton aria-label="Carregando a biblioteca" className="h-96 rounded-[20px]" />
      ) : tab === 'exercises' ? (
        <Exercises key={params.get('novo') ?? ''} list={data.exercises} desktop={desktop} selectedId={selectedId} />
      ) : tab === 'foods' ? (
        <Foods foods={data.foods} desktop={desktop} />
      ) : (
        <Materials materials={data.materials} desktop={desktop} />
      )}
    </main>
  )
}

export default function LibraryRoute() {
  return <LibraryPage />
}
