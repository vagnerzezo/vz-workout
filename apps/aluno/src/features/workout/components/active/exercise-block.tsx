import { CirclePlay, Plus, Timer } from 'lucide-react'
import { exerciseInitials, formatRest, musclesLine } from '@workspace/core'
import type { ExerciseView } from '../../hooks/use-session-view'
import { SET_GRID, SetRow } from './set-row'

type ExerciseBlockProps = {
  view: ExerciseView
  onEdit: (setKey: string, patch: { kg?: number | null; reps?: number | null }) => void
  onToggle: (setKey: string) => void
  onAddSet: () => void
  onStartRest: (seconds: number) => void
}

const chip =
  'flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

export function ExerciseBlock({ view, onEdit, onToggle, onAddSet, onStartRest }: ExerciseBlockProps) {
  const { exercise, prescribed, item, sets, counts } = view
  const titleId = `exercicio-${prescribed.id}`
  const prescription = [`${prescribed.reps} reps`, item.rir && `RIR ${item.rir}`, prescribed.technique].filter(Boolean).join(' · ')

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-sm font-extrabold text-foreground-2"
        >
          {exerciseInitials(exercise.name)}
        </span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h2 id={titleId} className="text-[17px] font-extrabold text-primary">
            {exercise.name}
          </h2>
          <span className="text-xs text-muted-foreground">{musclesLine(exercise.primary, exercise.secondary)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip} onClick={() => onStartRest(prescribed.restSeconds)}>
          <Timer aria-hidden="true" className="size-4" strokeWidth={2} />
          Descanso: {formatRest(prescribed.restSeconds)}
        </button>
        {exercise.videoUrl && (
          <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className={chip}>
            <CirclePlay aria-hidden="true" className="size-4" strokeWidth={2} />
            Ver vídeo
          </a>
        )}
      </div>

      <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] text-foreground-2">
        {counts.warmup > 0 && <Legend dot="bg-warning" label={`Aquecimento ${counts.warmup}`} />}
        {counts.prep > 0 && <Legend dot="bg-info" label={`Preparatória ${counts.prep}`} />}
        <Legend dot="bg-primary" label={`Válidas ${counts.working}`} />
        <span className="text-muted-foreground">{prescription}</span>
      </p>

      {item.note && (
        <div className="flex flex-col gap-1 rounded-[14px] border bg-card px-3.5 py-3">
          <span className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">OBSERVAÇÃO DO TREINADOR</span>
          <p className="text-[13px] leading-[1.45] text-foreground">{item.note}</p>
        </div>
      )}

      <div role="group" aria-label={`Séries de ${exercise.name}`} className="flex flex-col gap-1.5">
        <div aria-hidden="true" className={`${SET_GRID} px-0.5 text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground`}>
          <span className="text-center">SÉRIE</span>
          <span>ANTERIOR</span>
          <span className="text-center">KG</span>
          <span className="text-center">REPS</span>
          <span className="text-center">OK</span>
        </div>
        {sets.map((set) => (
          <SetRow key={set.key} set={set} onEdit={(patch) => onEdit(set.key, patch)} onToggle={() => onToggle(set.key)} />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSet}
        className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-dashed border-line-strong text-sm font-bold text-foreground-2 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.4} />
        Adicionar série
      </button>
    </section>
  )
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
