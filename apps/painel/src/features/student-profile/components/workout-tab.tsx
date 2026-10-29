import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import {
  formatKg,
  formatRest,
  musclesLine,
  parseIsoDate,
  phaseLabel,
  planWeek,
  shortDate,
  volumeStatus,
  weekdayLabel,
  weeklyVolume,
  muscleLabel,
  type Exercise,
  type WorkoutDay,
} from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
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
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { useDayVisibility, useRemoveExercise, useStudentPlan, useWorkingSets } from '../api/queries'
import { cardClass } from './card'

type Library = Record<string, Exercise>

const dayTitle = (d: WorkoutDay) => `Treino ${d.letter} — ${d.name}`
const validSets = (d: WorkoutDay) => d.exercises.reduce((s, e) => s + e.workingSets, 0)

/** Chips "Peito 12" do volume semanal; a cor diz se está abaixo, dentro ou acima de 10–20 séries. */
function VolumeChips({ days, library }: { days: WorkoutDay[]; library: Library }) {
  const volume = [...weeklyVolume(days, library).entries()].sort((a, b) => b[1] - a[1])
  if (volume.length === 0) return <span className="text-xs text-muted-foreground">Nenhum treino visível.</span>
  const tone = { low: 'text-warning', ok: 'text-foreground', high: 'text-destructive' } as const
  return (
    <ul className="flex flex-wrap gap-1.5">
      {volume.map(([m, sets]) => (
        <li key={m} className="flex h-7 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-xs text-foreground-2">
          {muscleLabel[m]} <strong className={tone[volumeStatus(sets)]}>{formatKg(sets)}</strong>
        </li>
      ))}
    </ul>
  )
}

function SetChips({ warmup, prep, working }: { warmup: number; prep: number; working: number }) {
  return (
    <span className="flex flex-wrap gap-1">
      {warmup > 0 && <span className="flex h-6 items-center rounded-full bg-info/14 px-2 text-[11px] font-bold text-info">Aquec. {warmup}</span>}
      {prep > 0 && <span className="flex h-6 items-center rounded-full bg-warning/14 px-2 text-[11px] font-bold text-warning">Prep. {prep}</span>}
      <span className="flex h-6 items-center rounded-full bg-primary/14 px-2 text-[11px] font-bold text-primary">Válidas {working}</span>
    </span>
  )
}

/** Exercícios do treino escolhido (desktop): séries por tipo, reps, descanso, editar e remover. */
function DayDetail({ studentId, planId, day, library }: { studentId: string; planId: string; day: WorkoutDay; library: Library }) {
  const remove = useRemoveExercise(studentId)
  const [toRemove, setToRemove] = useState<{ itemId: string; name: string } | null>(null)
  const editor = `/fichas/${planId}?aluno=${studentId}&treino=${day.id}`

  return (
    <section aria-labelledby="treino-aberto" className={cn(cardClass, 'gap-4')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="treino-aberto" className="text-lg font-extrabold">
            {dayTitle(day)}
          </h2>
          <span className="text-[13px] text-muted-foreground">
            {weekdayLabel(day.weekday)} · {day.exercises.length} exercícios · {validSets(day)} séries válidas
          </span>
        </div>
        <Link to={editor} className={cn(buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 font-bold' }))}>
          Abrir no editor
        </Link>
      </div>

      <ol className="flex flex-col">
        {day.exercises.map((item, i) => {
          const ex = library[item.exerciseId]
          const name = ex?.name ?? 'Exercício'
          return (
            <li key={item.id} className={cn('grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 xl:grid-cols-[28px_minmax(180px,1.4fr)_minmax(0,1.2fr)_80px_auto_auto]', i > 0 && 'border-t border-[#22252b]')}>
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-muted-foreground">{i + 1}</span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-extrabold">{name}</span>
                {ex && <span className="text-xs text-muted-foreground">{musclesLine(ex.primary, ex.secondary)}</span>}
              </div>
              <div className="col-start-2 flex flex-wrap gap-1 xl:col-start-auto">
                <SetChips warmup={item.warmupSets} prep={item.prepSets} working={item.workingSets} />
                {item.technique && <span className="flex h-6 items-center rounded-full bg-violet/14 px-2 text-[11px] font-bold text-violet">{item.technique}</span>}
              </div>
              <span className="col-start-2 text-[13px] text-foreground-2 xl:col-start-auto">{item.reps} reps</span>
              <span className="col-start-2 text-[13px] whitespace-nowrap text-foreground-2 xl:col-start-auto">desc. {formatRest(item.restSeconds)}</span>
              <div className="col-start-3 row-start-1 flex gap-1 xl:col-start-auto xl:row-start-auto">
                <Link to={editor} aria-label={`Editar ${name}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}>
                  <Pencil aria-hidden="true" />
                </Link>
                <Button variant="ghost" size="icon-sm" aria-label={`Remover ${name}`} onClick={() => setToRemove({ itemId: item.id, name })} className="text-destructive hover:text-destructive">
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          )
        })}
      </ol>
      {day.exercises.length === 0 && <p className="text-sm text-muted-foreground">Nenhum exercício neste treino.</p>}

      <div className="flex flex-col gap-2 border-t border-[#22252b] pt-3">
        <span className="text-[13px] font-bold text-foreground-2">Volume deste treino</span>
        <VolumeChips days={[day]} library={library} />
      </div>

      <AlertDialog open={toRemove !== null} onOpenChange={(open) => !open && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold">Remover {toRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>O exercício sai do {dayTitle(day)} e some do app do aluno.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const target = toRemove!
                setToRemove(null)
                remove.mutate(
                  { dayId: day.id, itemId: target.itemId },
                  { onSuccess: () => toast.success(`${target.name} removido`), onError: () => toast.error('Não foi possível remover. Tente de novo.') },
                )
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

/** Treino celular: um card por treino, abre para ajustar as séries válidas com −/+. */
function MobileDayCard({ studentId, day, visible, library, open, onToggle, onVisible }: {
  studentId: string
  day: WorkoutDay
  visible: boolean
  library: Library
  open: boolean
  onToggle: () => void
  onVisible: (v: boolean) => void
}) {
  const sets = useWorkingSets(studentId)
  return (
    <article className={cn('rounded-[18px] border bg-card', open && 'border-input')}>
      <div className="flex items-center gap-3 p-3.5">
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex grow items-center gap-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronDown aria-hidden="true" className={cn('size-4.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
          <span className="flex flex-col">
            <span className="text-[15px] font-extrabold">{dayTitle(day)}</span>
            <span className="text-xs text-muted-foreground">
              {visible ? weekdayLabel(day.weekday) : 'Rascunho'} · {day.exercises.length} exercícios
            </span>
          </span>
        </button>
        <Switch aria-label={`Visível para o aluno: ${dayTitle(day)}`} checked={visible} onCheckedChange={onVisible} />
      </div>
      {open && (
        <div className="flex flex-col gap-2 border-t border-[#22252b] p-3.5">
          {day.exercises.map((item, i) => {
            const name = library[item.exerciseId]?.name ?? 'Exercício'
            return (
              <div key={item.id} className="flex items-center gap-2.5">
                <span className="w-5 text-center text-xs font-extrabold text-muted-foreground">{i + 1}</span>
                <div className="flex min-w-0 grow flex-col">
                  <span className="truncate text-sm font-bold">{name}</span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {item.reps} reps · desc. {formatRest(item.restSeconds)}
                    {item.technique && ` · ${item.technique}`}
                  </span>
                </div>
                <div className="w-32 shrink-0">
                  <Stepper
                    label={`Séries válidas de ${name}`}
                    value={item.workingSets}
                    min={1}
                    max={8}
                    onChange={(v) => sets.mutate({ dayId: day.id, itemId: item.id, workingSets: v }, { onError: () => toast.error('Não foi possível salvar. Tente de novo.') })}
                  />
                </div>
              </div>
            )
          })}
          <p className="text-[11.5px] text-muted-foreground">Séries válidas. Para trocar exercícios ou montar a ficha, use o editor completo.</p>
        </div>
      )}
    </article>
  )
}

export function WorkoutTab({ studentId }: { studentId: string }) {
  const { data, isError } = useStudentPlan(studentId)
  const [params, setParams] = useSearchParams()
  const [openMobile, setOpenMobile] = useState<string | null>(null)
  const visibility = useDayVisibility(studentId)

  if (isError) return <p className="text-sm text-destructive">Não foi possível carregar a ficha.</p>
  if (!data) return <Skeleton aria-label="Carregando a ficha" className="h-80 rounded-[20px]" />
  if (!data.plan) return <NoPlan studentId={studentId} />

  const { plan } = data
  const library: Library = Object.fromEntries(data.exercises.map((e) => [e.id, e]))
  const isVisible = (d: WorkoutDay) => !data.hiddenDayIds.includes(d.id)
  const visibleDays = plan.days.filter(isVisible)
  const drafts = plan.days.filter((d) => !isVisible(d))
  const current = plan.days.find((d) => d.id === params.get('treino')) ?? plan.days[0]!
  const mobileOpen = openMobile ?? current.id
  const week = planWeek(plan, new Date())

  const setVisible = (day: WorkoutDay, visible: boolean) =>
    visibility.mutate(
      { dayId: day.id, visible },
      {
        onSuccess: () => toast.success(visible ? `${dayTitle(day)} visível no app` : `${dayTitle(day)} virou rascunho`),
        onError: () => toast.error('Não foi possível salvar. Tente de novo.'),
      },
    )
  const pick = (day: WorkoutDay) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('treino', day.id)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-extrabold">{plan.name}</h2>
        <span className="text-xs text-muted-foreground">
          {shortDate(parseIsoDate(plan.startsOn))} a {shortDate(parseIsoDate(plan.validUntil))} · semana {week} de {plan.durationWeeks}
        </span>
      </div>
      <span className="flex h-6 items-center rounded-full bg-primary/14 px-2.5 text-[11px] font-extrabold text-primary">{phaseLabel[plan.currentPhaseId]}</span>
    </div>
  )

  const dayRow = (d: WorkoutDay) => {
    const on = d.id === current.id
    const visible = isVisible(d)
    return (
      <li key={d.id} className={cn('flex items-center gap-3 rounded-2xl border p-3', on ? 'border-primary bg-primary/12' : 'bg-[#1a1c21]')}>
        <button type="button" aria-pressed={on} onClick={() => pick(d)} className="flex grow flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="text-sm font-extrabold">{dayTitle(d)}</span>
          <span className="text-xs text-muted-foreground">
            {visible ? weekdayLabel(d.weekday) : 'Rascunho'} · {d.exercises.length} exercícios
          </span>
        </button>
        <Switch aria-label={`Visível para o aluno: ${dayTitle(d)}`} checked={visible} onCheckedChange={(v) => setVisible(d, v)} />
      </li>
    )
  }

  return (
    <>
      {/* Desktop: fichas à esquerda, exercícios do treino escolhido à direita */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(300px,1fr)_2fr] lg:items-start">
        <section aria-label="Fichas do aluno" className={cn(cardClass, 'gap-3.5')}>
          {header}
          <span className="text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground">VISÍVEIS PARA O ALUNO</span>
          <ul className="flex flex-col gap-2">{visibleDays.map(dayRow)}</ul>
          {drafts.length > 0 && (
            <>
              <span className="text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground">FORA DO TREINO · RASCUNHOS</span>
              <ul className="flex flex-col gap-2">{drafts.map(dayRow)}</ul>
            </>
          )}
          <Link to={`/fichas/${plan.id}?aluno=${studentId}`} className={cn(buttonVariants({ variant: 'outline', className: 'h-10 font-bold' }))}>
            Abrir ficha no editor
          </Link>
          <div className="flex flex-col gap-2 border-t border-[#22252b] pt-3">
            <span className="text-[13px] font-bold">Volume da semana por músculo</span>
            <span className="text-[11.5px] text-muted-foreground">Séries válidas dos treinos visíveis · principal 1, secundário 0,5 · referência 10 a 20</span>
            <VolumeChips days={visibleDays} library={library} />
          </div>
        </section>
        <DayDetail studentId={studentId} planId={plan.id} day={current} library={library} />
      </div>

      {/* Celular: volume em cima e um card por treino */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        <section aria-label="Ficha atual" className={cn(cardClass, 'gap-3')}>
          {header}
          <VolumeChips days={visibleDays} library={library} />
          <span className="text-[11.5px] text-muted-foreground">Séries válidas por semana · faixa de referência 10 a 20</span>
        </section>
        {plan.days.map((d) => (
          <MobileDayCard
            key={d.id}
            studentId={studentId}
            day={d}
            visible={isVisible(d)}
            library={library}
            open={mobileOpen === d.id}
            onToggle={() => setOpenMobile(mobileOpen === d.id ? '' : d.id)}
            onVisible={(v) => setVisible(d, v)}
          />
        ))}
        <Link to={`/fichas/${plan.id}?aluno=${studentId}`} className={cn(buttonVariants({ variant: 'outline', size: 'lg', className: 'font-bold' }))}>
          Abrir editor completo
        </Link>
      </div>
    </>
  )
}

function NoPlan({ studentId }: { studentId: string }) {
  return (
    <section className={cn(cardClass, 'items-center py-10 text-center')}>
      <h2 className="text-base font-extrabold">Sem ficha de treino</h2>
      <p className="text-sm text-muted-foreground">O aluno ainda não tem uma ficha. Monte uma do zero ou parta de um modelo.</p>
      <Link to={`/fichas?atribuir=${studentId}`} className={cn(buttonVariants({ size: 'lg' }))}>
        Atribuir ficha
      </Link>
    </section>
  )
}
