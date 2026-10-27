import { useEffect } from 'react'
import { Timer } from 'lucide-react'
import { formatClock, formatKg, shortExerciseName } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { useNow } from '../../../../shared/hooks/use-now'
import type { SessionView } from '../../hooks/use-session-view'
import { restLeft, useActiveWorkout } from '../../store/active-workout'

export function nextSetLabel(next: SessionView['next']): string {
  if (!next) return 'Treino completo'
  const kg = next.set.entry?.kg ?? next.set.suggestion.kg
  const reps = next.set.entry?.reps ?? next.set.suggestion.reps
  return `${shortExerciseName(next.exercise.exercise.name)} · ${formatKg(kg)} kg × ${reps}`
}

const square =
  'h-11 rounded-[14px] border border-[#2e333b] bg-accent px-0 text-sm font-extrabold text-foreground hover:bg-secondary'

/** Barra flutuante: descanso correndo, ou a próxima série quando não há descanso. */
export function RestBar({ next, onOpenTimer }: { next: SessionView['next']; onOpenTimer: () => void }) {
  const now = useNow(500)
  const rest = useActiveWorkout((s) => s.rest)
  const { adjustRest, skipRest } = useActiveWorkout.getState()
  const left = restLeft(rest, now)
  const resting = left > 0
  const finished = rest.endsAt !== null && left === 0

  useEffect(() => {
    if (finished) navigator.vibrate?.(300)
  }, [finished])

  return (
    <div className="fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-[430px] px-4">
      <div className="flex flex-col gap-2.5 rounded-[22px] border border-[#2e333b] bg-[#1a1c21] py-3 pr-3 pl-4 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
        <p aria-live="polite" className="sr-only">
          {finished ? 'Descanso terminado' : ''}
        </p>
        {resting ? (
          <>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={onOpenTimer} className="flex grow flex-col items-start gap-px text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">DESCANSO</span>
                <span role="timer" className="text-[26px] font-extrabold tracking-[-0.5px] text-primary">
                  {formatClock(left)}
                </span>
              </button>
              <Button variant="ghost" className={`${square} w-13`} aria-label="Diminuir 15 segundos" onClick={() => adjustRest(-15)}>
                −15
              </Button>
              <Button variant="ghost" className={`${square} w-13`} aria-label="Aumentar 15 segundos" onClick={() => adjustRest(15)}>
                +15
              </Button>
              <Button className="h-11 rounded-[14px] px-3.5" onClick={skipRest}>
                Pular
              </Button>
            </div>
            <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-input">
              <div className="h-1 bg-primary" style={{ width: `${rest.total ? Math.round((left / rest.total) * 100) : 0}%` }} />
            </div>
          </>
        ) : (
          <div className="flex min-h-11 items-center gap-2.5">
            <Timer aria-hidden="true" className="size-5 text-muted-foreground" strokeWidth={1.9} />
            <p className="grow text-sm text-foreground-2">
              Próximo: <strong className="text-foreground">{nextSetLabel(next)}</strong>
            </p>
            <Button variant="ghost" className="h-11 rounded-[14px] border border-[#2e333b] px-3.5 text-[13px] font-bold" onClick={onOpenTimer}>
              Timer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
