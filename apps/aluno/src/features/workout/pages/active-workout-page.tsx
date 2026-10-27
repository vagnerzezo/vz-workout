import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { WARMUP_REST_SECONDS } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useSessionTemplate, useSyncPendingSets } from '../api/session'
import { ActiveHeader } from '../components/active/active-header'
import { ExerciseBlock } from '../components/active/exercise-block'
import { RestBar } from '../components/active/rest-bar'
import { RestTimerDrawer } from '../components/active/rest-timer-drawer'
import { SessionStats } from '../components/active/session-stats'
import { useSessionView } from '../hooks/use-session-view'
import { useActiveWorkout } from '../store/active-workout'

const STALE_MS = 3 * 60 * 60 * 1000

export default function ActiveWorkoutPage() {
  const { dayId = '' } = useParams()
  const navigate = useNavigate()
  const template = useSessionTemplate(dayId)
  const [timerOpen, setTimerOpen] = useState(false)
  const finished = useRef(false)

  const active = useActiveWorkout()
  const hasProgress = Object.keys(active.entries).length > 0
  const otherWorkout = active.dayId !== null && active.dayId !== dayId && hasProgress
  const view = useSessionView(template.data, active.dayId === dayId ? active.entries : {}, active.extraSets)

  useSyncPendingSets()

  // Começa a sessão ao abrir, a não ser que já exista outro treino com séries registradas.
  // Uma sessão aberta e esquecida, sem nenhuma série, recomeça com o relógio zerado.
  useEffect(() => {
    if (finished.current || otherWorkout) return
    if (active.dayId === dayId && active.finishedAt) active.resumeWorkout() // voltou do resumo
    const stale = !hasProgress && !!active.startedAt && Date.now() - Date.parse(active.startedAt) > STALE_MS
    if (active.dayId !== dayId || stale) active.start(dayId)
  }, [active, dayId, otherWorkout, hasProgress])

  if (otherWorkout) {
    return <OtherWorkoutInProgress activeDayId={active.dayId!} onDiscard={() => active.start(dayId)} />
  }
  if (template.isError) {
    return (
      <main className="mx-auto max-w-[430px] px-5">
        <ErrorState title="Não foi possível abrir o treino" onRetry={() => template.refetch()} retrying={template.isFetching} />
      </main>
    )
  }
  if (!view || !template.data || active.dayId !== dayId || !active.startedAt) {
    return <ActiveWorkoutSkeleton />
  }

  const { day } = template.data
  const meta = (key: string) => {
    const set = view.exercises.flatMap((e) => e.sets).find((s) => s.key === key)!
    return { set, meta: { prescribedId: set.prescribedId, kind: set.kind } }
  }

  const toggle = (key: string) => {
    const { set, meta: m } = meta(key)
    const nowDone = active.toggleDone(key, m, set.suggestion)
    if (nowDone && active.autoRest) {
      const rest = set.kind === 'warmup' ? WARMUP_REST_SECONDS : view.exercises.find((e) => e.prescribed.id === set.prescribedId)!.prescribed.restSeconds
      active.startRest(rest)
    }
  }

  const finishWorkout = () => {
    const anyDone = Object.values(active.entries).some((e) => e.doneAt)
    if (!anyDone) {
      toast.error('Conclua pelo menos uma série antes de finalizar.')
      return
    }
    finished.current = true
    active.markFinished()
    navigate(`/treinos/${active.sessionId}/resumo`)
  }

  return (
    <div className="mx-auto min-h-svh w-full max-w-[430px]">
      <ActiveHeader
        title={`Treino ${day.letter} — ${day.name}`}
        exerciseLabel={`Exercício ${view.currentIndex + 1} de ${view.exercises.length}`}
        onOpenTimer={() => setTimerOpen(true)}
        onFinish={finishWorkout}
      />
      <SessionStats startedAt={active.startedAt} volumeKg={view.volumeKg} doneCount={view.doneCount} total={view.total} />
      <main className="flex flex-col gap-7 px-5 pt-4.5 pb-[calc(140px+env(safe-area-inset-bottom))]">
        {view.exercises.map((ex) => (
          <ExerciseBlock
            key={ex.prescribed.id}
            view={ex}
            onEdit={(key, patch) => active.editSet(key, meta(key).meta, patch)}
            onToggle={toggle}
            onAddSet={() => active.addSet(ex.prescribed.id)}
            onStartRest={(seconds) => {
              active.startRest(seconds)
              setTimerOpen(true)
            }}
          />
        ))}
      </main>
      <RestBar next={view.next} onOpenTimer={() => setTimerOpen(true)} />
      <RestTimerDrawer open={timerOpen} onOpenChange={setTimerOpen} next={view.next} />
    </div>
  )
}

function OtherWorkoutInProgress({ activeDayId, onDiscard }: { activeDayId: string; onDiscard: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-[430px] flex-col justify-center gap-4 px-5 text-center">
      <h1 className="text-[22px] font-extrabold">Você tem outro treino em andamento</h1>
      <p className="text-sm text-muted-foreground">
        As séries que você já registrou nele estão salvas. Continue esse treino ou descarte para começar este.
      </p>
      <Button size="xl" nativeButton={false} render={<Link to={`/treinos/${activeDayId}/ativo`} replace />}>
        Continuar o treino em andamento
      </Button>
      <Button variant="destructive" size="xl" onClick={onDiscard}>
        Descartar e começar este
      </Button>
    </main>
  )
}

function ActiveWorkoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o treino" className="mx-auto flex max-w-[430px] flex-col gap-5 px-5 pt-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-10 grow" />
        <Skeleton className="h-11 w-24 rounded-full" />
      </div>
      <Skeleton className="h-14" />
      {Array.from({ length: 2 }, (_, i) => (
        <Skeleton key={i} className="h-90 rounded-[20px]" />
      ))}
    </div>
  )
}
