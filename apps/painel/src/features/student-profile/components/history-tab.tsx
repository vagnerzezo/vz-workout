import { formatDuration, type CoachWorkout } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table'
import { cn } from '@workspace/ui/lib/utils'
import { useStudentWorkouts } from '../api/queries'
import { Effort, RecordsBadge, recordsLabel, workoutDate, workoutVolume } from './workout-meta'

/** Histórico de treinos: tabela no desktop, cards no celular. */
export function HistoryTab({ studentId }: { studentId: string }) {
  const { data: workouts, isError } = useStudentWorkouts(studentId)
  if (isError) return <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p>
  if (!workouts) return <Skeleton aria-label="Carregando o histórico" className="h-64 rounded-[20px]" />
  if (workouts.length === 0) return <p className="rounded-[18px] border border-dashed border-line-strong p-5.5 text-center text-sm text-muted-foreground">Nenhum treino registrado ainda.</p>

  return (
    <>
      <section aria-label="Histórico de treinos" className="hidden overflow-hidden rounded-[20px] border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {['Data', 'Treino', 'Duração', 'Volume', 'Esforço', 'Recordes', 'Comentário do aluno'].map((h) => (
                <TableHead key={h} className="h-11 px-3 text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground uppercase first:pl-5">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.map((w: CoachWorkout) => (
              <TableRow key={w.id} className="border-[#22252b] text-[13px]">
                <TableCell className="px-3 py-3 pl-5 text-foreground-2">{workoutDate(w)}</TableCell>
                <TableCell className="px-3 font-extrabold">{w.name}</TableCell>
                <TableCell className="px-3 text-foreground-2">{formatDuration(w.durationMin)}</TableCell>
                <TableCell className="px-3 text-foreground-2">{workoutVolume(w)}</TableCell>
                <TableCell className="px-3">
                  <Effort value={w.effort} />
                </TableCell>
                <TableCell className={cn('px-3 font-bold', w.records ? 'text-warning' : 'text-muted-foreground')}>{recordsLabel(w.records)}</TableCell>
                <TableCell className="max-w-80 px-3 whitespace-normal text-foreground-2">{w.comment ?? <span className="text-muted-foreground">—</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <ul aria-label="Treinos" className="flex flex-col gap-2 lg:hidden">
        {workouts.map((w) => (
          <li key={w.id} className="flex flex-col gap-2 rounded-[18px] border bg-card p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[15px] font-extrabold">{w.name}</span>
              <span className="text-xs text-muted-foreground">{workoutDate(w)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-foreground-2">
              <span>{formatDuration(w.durationMin)}</span>
              <span>{workoutVolume(w)}</span>
              <span>
                esforço <Effort value={w.effort} />
              </span>
              <RecordsBadge count={w.records} className="h-5 text-[10.5px]" />
            </div>
            {w.comment && <p className="text-[13px] leading-[1.45] text-foreground-2">“{w.comment}”</p>}
          </li>
        ))}
      </ul>
    </>
  )
}
