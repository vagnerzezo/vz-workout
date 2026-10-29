import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, MoreHorizontal, Repeat, Trash2, X } from 'lucide-react'
import { formatRest, musclesLine, setRows, type Exercise, type Phase, type PrescribedExercise } from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

type ExerciseCardProps = {
  index: number
  item: PrescribedExercise
  exercise: Exercise | undefined
  phase: Phase
  first: boolean
  last: boolean
  onSets: (n: number) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
  onSwap: () => void
}

const kindColor = { warmup: 'text-warning', prep: 'text-info', working: 'text-primary' } as const
const kindDot = { warmup: 'bg-warning', prep: 'bg-info', working: 'bg-primary' } as const

const describe = (exercise: Exercise | undefined) => (exercise ? `${musclesLine(exercise.primary, exercise.secondary)} · ${exercise.equipment}` : '')

/** Desktop: cabeçalho com as válidas e os botões, e a tabela de séries já na fase escolhida. */
export function ExerciseCardDesktop({ index, item, exercise, phase, first, last, onSets, onMove, onRemove }: ExerciseCardProps) {
  const name = exercise?.name ?? 'Exercício'
  const rows = setRows(item, phase)
  const iconButton = 'size-8.5 rounded-full border-input text-foreground-2'
  return (
    <article aria-label={name} className="flex flex-col gap-2.5 rounded-[18px] border bg-card px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-foreground-2">{index + 1}</span>
        <div className="flex min-w-0 grow basis-55 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-extrabold">{name}</span>
            {item.technique && <span className="flex h-5.5 items-center rounded-full bg-warning/14 px-2 text-[11px] font-extrabold text-warning">{item.technique}</span>}
          </span>
          <span className="text-xs text-muted-foreground">{describe(exercise)}</span>
        </div>
        <div className="w-44">
          <Stepper label={`Séries válidas de ${name}`} value={item.workingSets} min={1} max={8} format={(v) => `${v} válidas`} onChange={onSets} />
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" aria-label={`Mover ${name} para cima`} disabled={first} onClick={() => onMove(-1)} className={iconButton}>
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={`Mover ${name} para baixo`} disabled={last} onClick={() => onMove(1)} className={iconButton}>
            <ChevronDown aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={`Remover ${name}`} onClick={onRemove} className={cn(iconButton, 'text-destructive hover:text-destructive')}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
      <table className="w-full border-separate border-spacing-y-0.5 text-[13px]">
        <thead>
          <tr className="text-left text-[10.5px] tracking-[0.8px] text-muted-foreground">
            <th className="w-28 px-2.5 pb-1 font-extrabold">SÉRIE</th>
            <th className="w-22 px-2.5 pb-1 font-extrabold">REPS</th>
            <th className="px-2.5 pb-1 font-extrabold">CARGA / ESFORÇO</th>
            <th className="w-22 px-2.5 pb-1 font-extrabold">DESCANSO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="bg-[#1a1c21]">
              <th scope="row" className={cn('rounded-l-lg px-2.5 py-1.5 text-left font-bold', kindColor[r.kind])}>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn('size-1.75 rounded-full', kindDot[r.kind])} />
                  {r.label}
                </span>
              </th>
              <td className="px-2.5 py-1.5 font-bold">{r.reps}</td>
              <td className="px-2.5 py-1.5 text-foreground-2">{r.effort}</td>
              <td className="rounded-r-lg px-2.5 py-1.5 text-muted-foreground">{formatRest(r.restSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

/** Celular: resumo das séries e ⋮ que abre Subir, Descer, Trocar e Remover logo abaixo. */
export function ExerciseCardMobile({ index, item, exercise, phase, first, last, onSets, onMove, onRemove, onSwap }: ExerciseCardProps) {
  const [menu, setMenu] = useState(false)
  const name = exercise?.name ?? 'Exercício'
  const chip = 'flex h-6 items-center rounded-full px-2 text-[11px] font-bold'
  const action = 'flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-accent text-[11px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40'
  return (
    <article aria-label={name} className={cn('flex flex-col gap-2.5 rounded-[18px] border bg-card p-3.5', menu && 'border-input')}>
      <div className="flex items-start gap-2.5">
        <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-foreground-2">{index + 1}</span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <span className="text-[15px] font-extrabold">{name}</span>
          <span className="text-[11.5px] text-muted-foreground">{describe(exercise)}</span>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Opções de ${name}`} aria-expanded={menu} onClick={() => setMenu(!menu)} className={cn('shrink-0', menu && 'bg-accent')}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {item.warmupSets > 0 && <span className={cn(chip, 'bg-warning/14 text-warning')}>Aquec. {item.warmupSets}</span>}
        {item.prepSets > 0 && <span className={cn(chip, 'bg-info/14 text-info')}>Prep. {item.prepSets}</span>}
        <span className="text-xs text-foreground-2">
          {item.reps} reps · RIR {phase.rir} · desc. {formatRest(item.restSeconds)}
        </span>
        {item.technique && <span className={cn(chip, 'bg-violet/14 text-violet')}>{item.technique}</span>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-foreground-2">Séries válidas</span>
        <div className="w-36">
          <Stepper label={`Séries válidas de ${name}`} value={item.workingSets} min={1} max={8} onChange={onSets} />
        </div>
      </div>
      {menu && (
        <div className="grid grid-cols-4 gap-1.5">
          <button type="button" disabled={first} onClick={() => onMove(-1)} className={action}>
            <ArrowUp aria-hidden="true" className="size-4" />
            Subir
          </button>
          <button type="button" disabled={last} onClick={() => onMove(1)} className={action}>
            <ArrowDown aria-hidden="true" className="size-4" />
            Descer
          </button>
          <button type="button" onClick={onSwap} className={action}>
            <Repeat aria-hidden="true" className="size-4" />
            Trocar
          </button>
          <button type="button" onClick={onRemove} className={cn(action, 'text-destructive')}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remover
          </button>
        </div>
      )}
    </article>
  )
}
