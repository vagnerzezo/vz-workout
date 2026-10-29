import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useBlocker, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft, MoreHorizontal, Pencil } from 'lucide-react'
import {
  applyPhase,
  estimateDuration,
  levelLabel,
  parseIsoDate,
  phaseLabel,
  shortDate,
  weekdayLabel,
  weeklyVolume,
  type Exercise,
  type PlanTemplateSummary,
  type WorkoutDay,
  type WorkoutPlan,
} from '@workspace/core'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { AssignPlanDrawer } from '../../plans/components/assign-plan-drawer'
import { useStudents } from '../../students/api/queries'
import { useExercises, useSaveStudentPlan, useSaveTemplate, useStudentSource, useTemplate } from '../api/queries'
import { ExerciseCardDesktop, ExerciseCardMobile } from '../components/exercise-card'
import { LibraryList } from '../components/library-list'
import { PhasePicker } from '../components/phase-picker'
import { VolumeAside, VolumeCollapsible } from '../components/volume-panel'
import { usePlanDraft } from '../hooks/use-plan-draft'

const dayTitle = (d: Pick<WorkoutDay, 'letter' | 'name'>) => `Treino ${d.letter} — ${d.name}`
const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`)

/** Séries e duração do dia na fase escolhida (as válidas já com o multiplicador). */
function dayStats(day: WorkoutDay, multiplier: number) {
  const items = day.exercises.map((e) => ({ ...e, workingSets: applyPhase(e.workingSets, { setMultiplier: multiplier }) }))
  return { sets: items.reduce((s, e) => s + e.warmupSets + e.prepSets + e.workingSets, 0), minutes: estimateDuration({ exercises: items }) }
}

type LibraryTarget = { mode: 'add' } | { mode: 'swap'; itemId: string; name: string }

/**
 * /fichas/:id — editor de um modelo. Com `?aluno=` edita a cópia daquele aluno (o link do perfil);
 * `?treino=` abre num dia. A ficha fica em rascunho na tela até "Salvar".
 */
export default function PlanEditorPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const studentId = params.get('aluno')
  const isDesktop = useIsDesktop()
  const template = useTemplate(id, !studentId)
  const student = useStudentSource(studentId)
  const exercises = useExercises()
  const draft = usePlanDraft()
  const saveTemplate = useSaveTemplate(id)
  const saveStudent = useSaveStudentPlan(studentId ?? '')
  const students = useStudents()
  const [phaseId, setPhaseId] = useState<WorkoutPlan['currentPhaseId'] | null>(null)
  const [library, setLibrary] = useState<LibraryTarget | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [savedNow, setSavedNow] = useState(false)
  const [assigning, setAssigning] = useState<PlanTemplateSummary | null>(null)

  const source = studentId ? student.plan.data?.plan : template.data?.plan
  const loadedFor = useRef<string | null>(null)
  const key = `${id}:${studentId ?? ''}`
  const { dispatch } = draft
  useEffect(() => {
    if (source && loadedFor.current !== key) {
      loadedFor.current = key
      dispatch({ type: 'load', plan: source })
    }
  }, [source, key, dispatch])

  // Sair com alterações não salvas pede confirmação (trocar de dia ou de fase não conta)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => draft.dirty && currentLocation.pathname !== nextLocation.pathname)

  const backTo = studentId ? `/alunos/${studentId}?aba=treino` : '/fichas'
  const backLabel = studentId ? 'Voltar para o aluno' : 'Voltar para fichas de treino'
  const isError = studentId ? student.plan.isError || student.detail.isError : template.isError
  const plan = draft.plan

  const shell = (children: ReactNode) => (
    <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-5 lg:pb-10">{children}</main>
  )

  if (isError || (studentId && student.plan.data && !student.plan.data.plan)) {
    return shell(
      <>
        <Link to={backTo} aria-label={backLabel} className="flex size-11 items-center justify-center rounded-full border bg-card">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <ErrorState title={isError ? 'Não foi possível abrir a ficha' : 'Este aluno ainda não tem ficha'} retrying={template.isFetching || student.plan.isFetching} onRetry={() => void (studentId ? student.plan.refetch() : template.refetch())} />
      </>,
    )
  }
  if (!plan || !exercises.data || (studentId && !student.detail.data)) return shell(<Skeleton aria-label="Carregando a ficha" className="h-[70vh] rounded-[20px]" />)

  const lib: Record<string, Exercise> = Object.fromEntries(exercises.data.map((e) => [e.id, e]))
  const phase = plan.phases.find((p) => p.id === (phaseId ?? plan.currentPhaseId)) ?? plan.phases[0]!
  const day = plan.days.find((d) => d.id === params.get('treino')) ?? plan.days[0]!
  const stats = dayStats(day, phase.setMultiplier)
  const volume = weeklyVolume(plan.days, lib, phase.setMultiplier)
  const summary = template.data?.summary
  const saving = saveTemplate.isPending || saveStudent.isPending

  const pickDay = (d: WorkoutDay) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('treino', d.id)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const save = () => {
    const onError = () => toast.error('Não foi possível salvar. Tente de novo.')
    const done = (saved: WorkoutPlan) => {
      draft.dispatch({ type: 'load', plan: saved })
      setSavedNow(true)
      toast.success(studentId ? `Ficha de ${student.detail.data!.student.fullName.split(' ')[0]} salva` : 'Ficha salva')
    }
    if (studentId) saveStudent.mutate(plan, { onSuccess: () => done(plan), onError })
    else saveTemplate.mutate(plan, { onSuccess: (r) => done(r.plan), onError })
  }

  const savedLabel = draft.dirty ? 'alterações não salvas' : savedNow ? 'salvo agora' : `atualizada em ${shortDate(parseIsoDate(plan.updatedAt))}`
  const meta = studentId
    ? `Ficha de ${student.detail.data!.student.fullName} · válida até ${shortDate(parseIsoDate(plan.validUntil))} · ${savedLabel}`
    : `${summary ? `${levelLabel[summary.level]} · ` : ''}${plan.days.length} dias por semana · ${plan.durationWeeks} semanas · usada por ${plural(summary?.studentsUsing ?? 0, 'aluno', 'alunos')} · ${savedLabel}`

  const cardProps = (i: number) => {
    const item = day.exercises[i]!
    return {
      index: i,
      item,
      exercise: lib[item.exerciseId],
      phase,
      first: i === 0,
      last: i === day.exercises.length - 1,
      onSets: (n: number) => draft.dispatch({ type: 'sets', dayId: day.id, itemId: item.id, n }),
      onMove: (delta: -1 | 1) => draft.dispatch({ type: 'move', dayId: day.id, itemId: item.id, delta }),
      onRemove: () => draft.dispatch({ type: 'remove', dayId: day.id, itemId: item.id }),
      onSwap: () => setLibrary({ mode: 'swap', itemId: item.id, name: lib[item.exerciseId]?.name ?? 'Exercício' }),
    }
  }

  const title = renaming ? (
    <input
      autoFocus
      aria-label="Nome da ficha"
      defaultValue={plan.name}
      onBlur={(e) => {
        const name = e.target.value.trim()
        if (name && name !== plan.name) draft.dispatch({ type: 'rename', name })
        setRenaming(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setRenaming(false)
      }}
      className="h-10 w-full min-w-0 rounded-xl border bg-card px-3 text-lg font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  ) : (
    <h1 className="text-lg leading-tight font-extrabold lg:text-[22px]">{plan.name}</h1>
  )

  const dayTabs = (
    <div role="tablist" aria-label="Dia" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
      {plan.days.map((d) => {
        const on = d.id === day.id
        return (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => pickDay(d)}
            className={cn(
              'flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-extrabold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-11',
              on ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-foreground',
            )}
          >
            <span className="lg:hidden">
              {d.letter} · {d.name}
            </span>
            <span className="hidden lg:inline">{dayTitle(d)}</span>
            <span className="text-[11px] opacity-80">{d.exercises.length}</span>
          </button>
        )
      })}
      {isDesktop && plan.days.length < 6 && (
        <button type="button" onClick={() => draft.dispatch({ type: 'addDay' })} className="h-11 shrink-0 rounded-full border border-dashed border-line-strong px-3.5 text-[13px] font-bold text-foreground-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          + Dia
        </button>
      )}
    </div>
  )

  const empty = <p className="rounded-[18px] border border-dashed border-line-strong p-8 text-center text-sm text-muted-foreground">{isDesktop ? 'Adicione exercícios pela biblioteca ao lado.' : 'Nenhum exercício neste dia.'}</p>

  const leaveDialog = (
    <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(open) => !open && blocker.reset?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-extrabold">Sair sem salvar?</AlertDialogTitle>
          <AlertDialogDescription>As alterações desta ficha vão se perder.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>Continuar editando</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
            Sair sem salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  const assignDrawer = (
    <AssignPlanDrawer template={assigning} students={students.data?.students ?? []} preselected={[]} now={new Date()} onClose={() => setAssigning(null)} onAssigned={() => {}} />
  )
  const canAssign = !studentId && summary && !summary.archived

  if (isDesktop) {
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
                <Button variant="ghost" size="icon-sm" aria-label="Renomear ficha" onClick={() => setRenaming(true)}>
                  <Pencil aria-hidden="true" />
                </Button>
              )}
              <span className="flex h-6 items-center rounded-full bg-primary/12 px-2.5 text-[11px] font-extrabold text-primary">{studentId ? 'Ficha do aluno' : 'Modelo'}</span>
            </div>
            <span className="text-[13px] text-muted-foreground">{meta}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" onClick={() => toast('A pré-visualização no app chega em breve')} className="font-bold">
              Pré-visualizar no app
            </Button>
            {canAssign && (
              <Button variant="outline" size="lg" disabled={draft.dirty} title={draft.dirty ? 'Salve antes de atribuir' : undefined} onClick={() => setAssigning(summary)} className="font-bold">
                Atribuir a alunos
              </Button>
            )}
            <Button size="lg" disabled={!draft.dirty || saving} onClick={save} className="px-5 font-extrabold">
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </header>

        <section aria-labelledby="periodizacao" className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="periodizacao" className="text-[15px] font-extrabold">
              Periodização · {plan.durationWeeks} semanas
            </h2>
            <span className="text-xs text-muted-foreground">Cada fase ajusta as séries válidas e o RIR de todos os treinos</span>
          </div>
          <PhasePicker phases={plan.phases} current={phase.id} onChange={setPhaseId} />
        </section>

        <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-5 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <section aria-labelledby="biblioteca" className="flex max-h-[calc(100vh-120px)] flex-col gap-3 rounded-[20px] border bg-card p-4 lg:sticky lg:top-5">
            <h2 id="biblioteca" className="text-[15px] font-extrabold">
              Biblioteca
            </h2>
            <LibraryList library={exercises.data} variant="aside" actionLabel={(e) => `Adicionar ${e.name} ao ${dayTitle(day)}`} onPick={(e) => draft.dispatch({ type: 'add', dayId: day.id, exerciseId: e.id })} />
          </section>

          <section aria-label="Treinos da ficha" className="flex min-w-0 flex-col gap-3.5">
            {dayTabs}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 rounded-[20px] border bg-card px-4.5 py-4">
              <div className="flex grow basis-55 flex-col gap-0.5">
                <h2 className="text-lg font-extrabold text-primary">{dayTitle(day)}</h2>
                <span className="text-xs text-muted-foreground">
                  Dia sugerido: {weekdayLabel(day.weekday)} · fase {phaseLabel[phase.id]}: RIR {phase.rir} nas válidas
                </span>
              </div>
              <Stat label="Exercícios" value={day.exercises.length} />
              <Stat label="Séries totais" value={stats.sets} />
              <Stat label="Duração estimada" value={`~${stats.minutes} min`} />
            </div>
            {day.exercises.map((e, i) => (
              <ExerciseCardDesktop key={e.id} {...cardProps(i)} />
            ))}
            {day.exercises.length === 0 && empty}
          </section>

          <div className="col-start-2 2xl:col-start-auto">
            <VolumeAside volume={volume} phase={phase} />
          </div>
        </div>
        {assignDrawer}
        {leaveDialog}
      </>,
    )
  }

  return shell(
    <>
      <header className="flex items-center gap-2.5">
        <Link to={backTo} aria-label={backLabel} className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          {title}
          <span className="truncate text-xs text-muted-foreground">{savedLabel}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Mais opções da ficha" className="shrink-0 rounded-full border-input" />}>
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => setRenaming(true)}>Renomear</DropdownMenuItem>
            {canAssign && (
              <DropdownMenuItem disabled={draft.dirty} onClick={() => setAssigning(summary)}>
                Atribuir a alunos
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section aria-labelledby="fase-ficha" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="fase-ficha" className="text-[13px] font-extrabold tracking-[0.5px] text-muted-foreground">
            FASE · {plan.durationWeeks} SEMANAS
          </h2>
          <span className="text-[11.5px] text-muted-foreground">
            séries ×{String(phase.setMultiplier).replace('.', ',')} · RIR {phase.rir}
          </span>
        </div>
        <PhasePicker phases={plan.phases} current={phase.id} onChange={setPhaseId} />
      </section>

      <VolumeCollapsible volume={volume} phase={phase} />
      {dayTabs}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Exercícios" value={day.exercises.length} boxed />
        <Stat label="Séries" value={stats.sets} boxed />
        <Stat label="Duração" value={`~${stats.minutes} min`} boxed />
      </div>

      <section aria-label={`Exercícios de ${dayTitle(day)}`} className="flex flex-col gap-2.5">
        {day.exercises.map((e, i) => (
          <ExerciseCardMobile key={e.id} {...cardProps(i)} />
        ))}
        {day.exercises.length === 0 && empty}
        <Button variant="outline" size="lg" onClick={() => setLibrary({ mode: 'add' })} className="h-12 border-dashed font-bold">
          + Adicionar exercício
        </Button>
      </section>

      <div className="sticky bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 grid grid-cols-[auto_1fr] gap-2 rounded-full border bg-background/95 p-1.5 backdrop-blur">
        <Button variant="outline" size="lg" onClick={() => toast('A pré-visualização no app chega em breve')} className="font-bold">
          Ver como aluno
        </Button>
        <Button size="lg" disabled={!draft.dirty || saving} onClick={save} className="font-extrabold">
          {saving ? 'Salvando…' : draft.dirty ? 'Salvar alterações' : 'Salvo'}
        </Button>
      </div>

      <Drawer open={library !== null} onOpenChange={(open) => !open && setLibrary(null)}>
        <DrawerContent className="mx-auto max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="text-[17px] font-extrabold">{library?.mode === 'swap' ? `Trocar ${library.name}` : `Adicionar ao ${dayTitle(day)}`}</DrawerTitle>
            <DrawerDescription className="text-xs">{library?.mode === 'swap' ? 'Mantém as séries e o descanso' : 'Toque no exercício para adicionar'}</DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-col px-4 pt-3 pb-4">
            <LibraryList
              library={exercises.data}
              variant="sheet"
              actionLabel={(e) => (library?.mode === 'swap' ? `Trocar por ${e.name}` : `Adicionar ${e.name}`)}
              onPick={(e) => {
                if (library?.mode === 'swap') draft.dispatch({ type: 'swap', dayId: day.id, itemId: library.itemId, exerciseId: e.id })
                else draft.dispatch({ type: 'add', dayId: day.id, exerciseId: e.id })
                setLibrary(null)
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
      {assignDrawer}
      {leaveDialog}
    </>,
  )
}

function Stat({ label, value, boxed = false }: { label: string; value: ReactNode; boxed?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-px', boxed && 'rounded-2xl border bg-card px-3 py-2.5')}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-lg font-extrabold">{value}</span>
    </div>
  )
}
