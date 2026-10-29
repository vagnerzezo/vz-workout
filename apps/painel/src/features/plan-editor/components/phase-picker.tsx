import { formatKg, phaseLabel, phaseWeeksLabel, type Phase } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type PhasePickerProps = { phases: Phase[]; current: Phase['id']; onChange: (id: Phase['id']) => void }

/**
 * A fase escolhida muda o que a tela mostra (válidas com o multiplicador, RIR, volume).
 * Desktop: largura proporcional às semanas, com multiplicador e RIR; celular: nome e semanas.
 */
export function PhasePicker({ phases, current, onChange }: PhasePickerProps) {
  return (
    <div role="radiogroup" aria-label="Fase" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      {phases.map((p) => {
        const on = p.id === current
        const weeks = p.weeks[1] - p.weeks[0] + 1
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p.id)}
            style={{ flexGrow: weeks }}
            className={cn(
              'flex min-h-14 min-w-28 shrink-0 basis-0 flex-col items-start justify-center gap-0.5 rounded-[14px] border px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:min-h-16 lg:min-w-30',
              on ? 'border-primary bg-primary/12' : 'bg-card',
            )}
          >
            <span className={cn('text-[13px] font-extrabold lg:text-sm', on && 'text-primary')}>{phaseLabel[p.id]}</span>
            <span className="text-[11px] text-muted-foreground lg:text-xs">
              {phaseWeeksLabel(p)}
              <span className="hidden lg:inline">
                {' '}
                · séries ×{formatKg(p.setMultiplier)} · RIR {p.rir}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
