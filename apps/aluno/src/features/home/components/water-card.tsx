import { Target } from 'lucide-react'
import { toast } from 'sonner'
import { formatLiters } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useAddWater, useIsSavingWater, useUndoWater, useWaterToday, WATER_ERRORS } from '../../../shared/api/water'
import { SurfaceCard, SurfaceCardTitle } from '../../../shared/components/surface-card'

const MAX_DAY_ML = 10_000 // trava contra toques repetidos por engano

export function WaterCard() {
  const { data: water } = useWaterToday()
  const addWater = useAddWater()
  const undoWater = useUndoWater()
  const saving = useIsSavingWater()
  if (!water) return <Skeleton className="h-45 rounded-[20px]" />

  const lastEntry = water.entries.at(-1)
  const pct = Math.min(Math.round((water.consumedMl / water.goalMl) * 100), 100)

  const add = (ml: number) => addWater.mutate(ml, { onError: () => toast.error(WATER_ERRORS.add) })
  const undo = () => lastEntry && undoWater.mutate(lastEntry.id, { onError: () => toast.error(WATER_ERRORS.undo) })

  return (
    <SurfaceCard role="region" aria-labelledby="agua" className="gap-3.5">
      <div className="flex items-center justify-between">
        <SurfaceCardTitle id="agua">Água</SurfaceCardTitle>
        <span className="flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold text-foreground-2">
          <Target aria-hidden="true" className="size-3.5" strokeWidth={2} />
          Meta {formatLiters(water.goalMl)}
        </span>
      </div>
      <p className="flex items-baseline gap-1.5" aria-live="polite">
        <span className="text-[30px] font-extrabold tracking-[-0.5px]">{formatLiters(water.consumedMl)}</span>
        <span className="text-sm text-muted-foreground">de {formatLiters(water.goalMl)}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Água ingerida"
        aria-valuemin={0}
        aria-valuemax={water.goalMl}
        aria-valuenow={water.consumedMl}
        aria-valuetext={`${formatLiters(water.consumedMl)} de ${formatLiters(water.goalMl)}`}
        className="h-2.5 overflow-hidden rounded-full bg-border"
      >
        <div className="h-2.5 rounded-full bg-info motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" className="border-border text-sm font-bold" disabled={water.consumedMl + 250 > MAX_DAY_ML} onClick={() => add(250)}>
          +250 ml
        </Button>
        <Button variant="secondary" className="border-border text-sm font-bold" disabled={water.consumedMl + 500 > MAX_DAY_ML} onClick={() => add(500)}>
          +500 ml
        </Button>
        <Button
          variant="outline"
          className="border-border text-sm font-bold text-muted-foreground"
          disabled={!lastEntry || saving}
          onClick={undo}
          aria-label={lastEntry ? `Desfazer último registro de ${lastEntry.ml} ml` : 'Desfazer'}
        >
          Desfazer
        </Button>
      </div>
    </SurfaceCard>
  )
}
