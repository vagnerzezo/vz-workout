import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Check, ChevronLeft, Share } from 'lucide-react'
import { toast } from 'sonner'
import { formatDuration, formatInt, parseIsoDate, shortDate, toIsoDate, weekdayName } from '@workspace/core'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Textarea } from '@workspace/ui/components/textarea'
import { ErrorState } from '../../../shared/components/error-state'
import { useCurrentPlan } from '../api/queries'
import { discardSession, useFinishSession, useSessionTemplate } from '../api/session'
import { EffortScale, MuscleSetsCard, RecordsCard, StatTiles } from '../components/summary/summary-sections'
import { useSessionSummary } from '../hooks/use-session-summary'
import { useSessionView } from '../hooks/use-session-view'
import { toLoggedSet, useActiveWorkout } from '../store/active-workout'

const iconButton =
  'flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

export default function SessionSummaryPage() {
  const { sessionId } = useParams()
  const active = useActiveWorkout()
  const isDraft = active.sessionId === sessionId && !!active.dayId && !!active.startedAt
  const [left, setLeft] = useState(false) // salvou ou descartou: não pisca "não encontrado" antes de navegar

  if (!isDraft) return left ? null : <NotFound />
  return <DraftSummary onLeave={() => setLeft(true)} />
}

function DraftSummary({ onLeave }: { onLeave: () => void }) {
  const navigate = useNavigate()
  const active = useActiveWorkout()
  const dayId = active.dayId!
  const template = useSessionTemplate(dayId)
  const plan = useCurrentPlan()
  const finish = useFinishSession()
  const view = useSessionView(template.data, active.entries, active.extraSets)
  const summary = useSessionSummary(view)
  const [finishedAt] = useState(() => active.finishedAt ?? new Date().toISOString())

  if (template.isError) {
    return (
      <main className="mx-auto max-w-[430px] px-5">
        <ErrorState title="Não foi possível montar o resumo" onRetry={() => template.refetch()} retrying={template.isFetching} />
      </main>
    )
  }
  if (!view || !summary || !template.data) return <SummarySkeleton />

  const { day } = template.data
  const title = `Treino ${day.letter} — ${day.name}`
  const started = new Date(active.startedAt!)
  const minutes = (Date.parse(finishedAt) - started.getTime()) / 60_000
  const doneBefore = plan.data?.doneThisWeek.filter((id) => id !== dayId).length
  const subtitle = [
    title,
    `${weekdayName(started).replace('-feira', '')}, ${shortDate(parseIsoDate(toIsoDate(started)))}`,
    doneBefore !== undefined && `${doneBefore + 1}º treino da semana`,
  ]
    .filter(Boolean)
    .join(' · ')

  const stats = [
    { label: 'Duração', value: formatDuration(minutes) },
    { label: 'Volume', value: `${formatInt(view.volumeKg)} kg` },
    { label: 'Séries', value: `${view.doneCount} de ${view.total}` },
    {
      label: 'Recordes',
      value: summary.records.length === 0 ? 'Nenhum' : summary.records.length === 1 ? '1 novo' : `${summary.records.length} novos`,
      highlight: summary.records.length > 0,
    },
  ]

  const share = () =>
    navigator
      .share?.({ title: `${title} concluído`, text: `${title} concluído: ${stats.map((s) => `${s.label} ${s.value}`).join(' · ')}` })
      .catch(() => {}) // o aluno fechou a folha de compartilhar

  const save = () =>
    finish.mutate(
      {
        sessionId: active.sessionId!,
        body: {
          dayId,
          startedAt: active.startedAt!,
          finishedAt,
          sets: Object.entries(active.entries)
            .filter(([, e]) => e.doneAt)
            .map(([key, e]) => toLoggedSet(key, e)),
          effort: active.effort,
          comment: active.comment.trim() || null,
        },
      },
      {
        onSuccess: () => {
          onLeave()
          active.reset()
          toast.success('Treino salvo')
          navigate('/', { replace: true })
        },
        onError: () => toast.error('Não foi possível salvar agora. O treino continua no aparelho; tente de novo com internet.'),
      },
    )

  const discard = () => {
    onLeave()
    discardSession(active.sessionId!)
    active.reset()
    navigate('/treinos', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <Link to={`/treinos/${dayId}/ativo`} aria-label="Voltar ao treino" className={iconButton} onClick={() => active.resumeWorkout()}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        {'share' in navigator && (
          <button type="button" aria-label="Compartilhar resumo" onClick={share} className={iconButton}>
            <Share aria-hidden="true" className="size-4.5" strokeWidth={2} />
          </button>
        )}
      </div>

      <header className="flex flex-col items-center gap-2 py-1 text-center">
        <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-7.5" strokeWidth={2.6} />
        </span>
        <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Treino concluído</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <StatTiles items={stats} />
      {summary.records.length > 0 && <RecordsCard records={summary.records} />}
      <MuscleSetsCard muscles={summary.muscles} />
      <EffortScale value={active.effort} onChange={active.setEffort} />

      <div className="flex flex-col gap-2">
        <label htmlFor="comentario" className="text-[15px] font-bold">
          Comentário para o treinador
        </label>
        <Textarea
          id="comentario"
          rows={3}
          maxLength={1000}
          value={active.comment}
          onChange={(e) => active.setComment(e.target.value)}
          placeholder="Ex.: senti o joelho na última série do hack"
          className="min-h-24 resize-none rounded-2xl bg-card px-3.5 py-3 dark:bg-card"
        />
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        <Button size="xl" className="text-base" onClick={save} disabled={finish.isPending}>
          {finish.isPending ? 'Salvando…' : 'Salvar treino'}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" className="text-sm font-bold text-destructive hover:text-destructive" />}>
            Descartar treino
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-extrabold">Descartar este treino?</AlertDialogTitle>
              <AlertDialogDescription>As séries registradas serão apagadas. Não dá para desfazer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={discard}>
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  )
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[430px] flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-[22px] font-extrabold">Resumo indisponível</h1>
      <p className="text-sm text-muted-foreground">Este treino já foi salvo ou descartado.</p>
      <Button variant="outline" nativeButton={false} render={<Link to="/treinos" />}>
        Ver treinos
      </Button>
    </main>
  )
}

function SummarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o resumo" className="mx-auto flex max-w-[430px] flex-col items-center gap-5 px-5 pt-20">
      <Skeleton className="size-16 rounded-full" />
      <Skeleton className="h-8 w-56" />
      <div className="grid w-full grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-[20px]" />
    </div>
  )
}
